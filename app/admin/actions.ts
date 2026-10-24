"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, localAuthAllowed, localToken } from "@/lib/auth";
import { COOKIE, MAX_AGE } from "@/lib/session";
import { db, usingSupabase } from "@/lib/db";
import { serverClient } from "@/lib/supabase/server";
import { getAllVolumes, getSite } from "@/lib/volumes";
import { parseVolume, safeUrl, SPOTIFY_HOST, PINTEREST_HOST } from "@/lib/validate";
import { fetchPosts, normalizeSubstackUrl } from "@/lib/substack";
import { fetchSubstackNotes, substackHandle } from "@/lib/notes";
import type { Settings, Status } from "@/lib/types";

const refresh = () => revalidatePath("/", "layout");
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Erreur inconnue.");

/* ---------- connexion ---------- */
export async function login(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const password = String(form.get("password") ?? "");
  if (usingSupabase) {
    const email = String(form.get("email") ?? "").trim();
    if (!email || !password) return { error: "Renseigne ton e-mail et ton mot de passe." };
    const sb = await serverClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: "E-mail ou mot de passe incorrect." };
    const { data: ok } = await sb.rpc("is_admin");
    if (ok !== true) {
      await sb.auth.signOut();
      return { error: "Ce compte n'est pas autorisé. Vérifie la dernière étape du fichier schema.sql (table admins)." };
    }
  } else {
    if (!localAuthAllowed()) return { error: "Base de données non configurée : renseigne content/supabase.json (voir le README)." };
    if (password !== process.env.ADMIN_PASSWORD) { await new Promise((r) => setTimeout(r, 600)); return { error: "Mot de passe incorrect." }; }
    (await cookies()).set(COOKIE, localToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
  }
  redirect("/admin");
}

export async function logout() {
  if (usingSupabase) await (await serverClient()).auth.signOut();
  else (await cookies()).delete(COOKIE);
  redirect("/admin/login");
}

export async function changePassword(_p: unknown, form: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!usingSupabase) return { error: "Disponible uniquement avec Supabase." };
  const pw = String(form.get("password") ?? "");
  if (pw.length < 12) return { error: "12 caractères minimum." };
  if (pw !== String(form.get("confirm") ?? "")) return { error: "Les deux mots de passe ne correspondent pas." };
  const { error } = await (await serverClient()).auth.updateUser({ password: pw });
  return error ? { error: error.message } : { ok: true };
}

/* ---------- volumes ---------- */
export async function saveVolume(json: string, isNew: boolean): Promise<{ ok: boolean; error?: string; slug?: string }> {
  await requireAdmin();
  try {
    const all = await getAllVolumes(true);
    const parsed = parseVolume(JSON.parse(json), all.map((v) => v.number), isNew);
    if (!parsed.volume) return { ok: false, error: parsed.error };
    await db.upsertVolume(parsed.volume);
    refresh();
    return { ok: true, slug: parsed.volume.slug };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function setStatus(form: FormData) {
  await requireAdmin();
  const slug = String(form.get("slug"));
  const status = String(form.get("status")) as Status;
  if (!["hidden", "draft", "published"].includes(status)) return;
  const row = (await getAllVolumes(true)).find((v) => v.slug === slug);
  if (!row) return;
  const { origin: _o, ...vol } = row;
  await db.upsertVolume({ ...vol, status });
  refresh();
  revalidatePath("/admin");
}

export async function deleteVolume(form: FormData) {
  await requireAdmin();
  await db.deleteVolume(String(form.get("slug")));
  refresh();
  revalidatePath("/admin");
}

/* ---------- Substack : test & réglages ---------- */
export type SubstackTest = { ok: boolean; message: string; titles?: string[] };

export async function testSubstack(url: string): Promise<SubstackTest> {
  await requireAdmin();
  const origin = normalizeSubstackUrl(url);
  if (!origin) return { ok: false, message: "Adresse illisible. Exemple : https://monnom.substack.com" };
  const r = await fetchPosts(origin, true);
  return r.posts.length
    ? { ok: true, message: `${r.posts.length} article(s) trouvé(s) via ${r.source === "rss" ? "le flux RSS" : "l'API Substack"}.`, titles: r.posts.slice(0, 3).map((p) => p.title) }
    : { ok: false, message: `Aucun article récupéré depuis ${origin}. ${r.error ?? ""}` };
}

export async function saveSettings(_p: unknown, form: FormData): Promise<{ ok: boolean; error?: string; test?: SubstackTest }> {
  await requireAdmin();
  const sub = String(form.get("substackUrl") ?? "").trim();
  const origin = sub ? normalizeSubstackUrl(sub) : "";
  if (sub && !origin) return { ok: false, error: "Adresse Substack illisible." };
  const handle = String(form.get("substackHandle") ?? "").trim().replace(/^@/, "");
  if (handle && !/^[a-z0-9_.-]{1,60}$/i.test(handle)) return { ok: false, error: "Pseudo Substack invalide (lettres, chiffres, - _ .)." };
  const spotify = safeUrl(form.get("spotifyProfileUrl"), { host: SPOTIFY_HOST });
  const pinterest = safeUrl(form.get("pinterestProfileUrl"), { host: PINTEREST_HOST });
  const insta = safeUrl(form.get("instagramUrl"), { host: /(^|\.)instagram\.com$/i });
  if (spotify === null) return { ok: false, error: "Lien Spotify invalide (open.spotify.com/user/…)." };
  if (pinterest === null) return { ok: false, error: "Lien Pinterest invalide (pinterest.com/ton-compte/)." };
  if (insta === null) return { ok: false, error: "Lien Instagram invalide." };
  const topic = String(form.get("letterTopic") ?? "").trim().slice(0, 140);

  const settings: Settings = { substackUrl: origin || "", substackHandle: handle, spotifyProfileUrl: spotify, pinterestProfileUrl: pinterest, instagramUrl: insta, letterTopic: topic };
  try {
    await db.saveSettings(settings);
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
  revalidateTag("substack");
  refresh();
  return { ok: true, test: origin ? await testSubstack(origin) : undefined };
}

/* ---------- Notes ---------- */
export async function addNote(_p: unknown, form: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const text = String(form.get("text") ?? "").trim().slice(0, 1500);
  if (!text) return { error: "Écris le texte de la note." };
  const url = safeUrl(form.get("url"));
  if (url === null || (url && !url.startsWith("http"))) return { error: "Lien invalide (https://…)." };
  const d = String(form.get("date") ?? "");
  const date = d && !isNaN(new Date(d).getTime()) ? new Date(d).toISOString() : new Date().toISOString();
  try {
    await db.addNote({ text, date, url: url || undefined });
  } catch (e) {
    return { error: errMsg(e) };
  }
  refresh();
  revalidatePath("/admin/notes");
  return { ok: true };
}

export async function deleteNote(form: FormData) {
  await requireAdmin();
  await db.deleteNote(String(form.get("id")));
  refresh();
  revalidatePath("/admin/notes");
}

export async function testNotes(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const handle = substackHandle(await getSite(true));
  if (!handle) return { ok: false, message: "Renseigne ton pseudo Substack dans Réglages pour l'import automatique." };
  const r = await fetchSubstackNotes(handle, true);
  return r.notes.length
    ? { ok: true, message: `${r.notes.length} note(s) importée(s) automatiquement depuis @${handle}.` }
    : { ok: false, message: `Import automatique impossible (${r.error ?? "inconnu"}). Ajoute tes notes à la main : elles s'affichent de la même façon.` };
}

/* ---------- modération ---------- */
export async function moderate(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const op = String(form.get("op"));
  if (op === "delete") await db.removeMessage(id);
  else if (op === "approve") await db.updateMessage(id, { status: "approved" });
  else if (op === "reject") await db.updateMessage(id, { status: "rejected" });
  else if (op === "pending") await db.updateMessage(id, { status: "pending" });
  else if (op === "reply") {
    const reply = String(form.get("reply") ?? "").trim().slice(0, 1500);
    await db.updateMessage(id, reply ? { reply, repliedAt: new Date().toISOString(), status: "approved" } : { reply: null, repliedAt: null });
  }
  refresh();
  revalidatePath("/admin/messages");
}
