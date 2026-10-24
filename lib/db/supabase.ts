import { anonClient } from "@/lib/supabase/anon";
import { serverClient } from "@/lib/supabase/server";
import type { Message, Note, PublicMessage, Settings, Volume } from "@/lib/types";

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

/* ---- correspondances ligne <-> objet ---- */
type VRow = { slug: string; number: number; status: Volume["status"]; release_date: string | null; hooks: string[] | null; handwritten: string | null; editorial: string | null; cover: string | null; pdf: string | null; sections: Volume["sections"]; playlists: Volume["playlists"]; moodboards: Volume["moodboards"] };
const toVolume = (r: VRow): Volume => ({
  slug: r.slug, number: r.number, title: "GLITCH", status: r.status,
  releaseDate: r.release_date ?? undefined, hooks: r.hooks ?? [], handwritten: r.handwritten ?? undefined, editorial: r.editorial ?? undefined,
  cover: r.cover ?? undefined, pdf: r.pdf ?? undefined, sections: r.sections ?? [], playlists: r.playlists ?? [], moodboards: r.moodboards ?? [],
});
const fromVolume = (v: Volume) => ({
  slug: v.slug, number: v.number, status: v.status, release_date: v.releaseDate || null, hooks: v.hooks, handwritten: v.handwritten ?? null,
  editorial: v.editorial ?? null, cover: v.cover ?? null, pdf: v.pdf ?? null, sections: v.sections, playlists: v.playlists, moodboards: v.moodboards,
  updated_at: new Date().toISOString(),
});

type MRow = { id: string; kind: Message["kind"]; target_type: "volume" | "post" | null; target_slug: string | null; name: string; subject: string | null; body: string; status: Message["status"]; reply: string | null; replied_at: string | null; created_at: string; message_contacts?: { email: string }[] | { email: string } | null };
const toMessage = (r: MRow): Message => {
  const c = Array.isArray(r.message_contacts) ? r.message_contacts[0] : r.message_contacts;
  return {
    id: r.id, kind: r.kind, name: r.name, subject: r.subject ?? undefined, body: r.body, status: r.status, createdAt: r.created_at,
    target: r.target_type && r.target_slug ? { type: r.target_type, slug: r.target_slug } : undefined,
    reply: r.reply ?? undefined, repliedAt: r.replied_at ?? undefined, email: c?.email,
  };
};

/* ---- volumes ---- */
export async function listVolumes(admin: boolean): Promise<Volume[]> {
  const sb = admin ? await serverClient() : anonClient();
  const { data, error } = await sb.from("volumes").select("*").order("number", { ascending: false });
  fail(error);
  return (data as VRow[]).map(toVolume);
}
export async function upsertVolume(v: Volume) {
  const { error } = await (await serverClient()).from("volumes").upsert(fromVolume(v));
  fail(error);
}
export async function deleteVolume(slug: string) {
  const { error } = await (await serverClient()).from("volumes").delete().eq("slug", slug);
  fail(error);
}

/* ---- réglages ---- */
export async function getSettings(admin = false): Promise<Settings> {
  const sb = admin ? await serverClient() : anonClient();
  const { data, error } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
  fail(error);
  return (data?.data as Settings) ?? {};
}
export async function saveSettings(s: Settings) {
  const { error } = await (await serverClient()).from("settings").upsert({ id: 1, data: s });
  fail(error);
}

/* ---- notes manuelles ---- */
export async function listNotes(): Promise<Note[]> {
  const { data, error } = await anonClient().from("notes").select("*").order("date", { ascending: false }).limit(100);
  fail(error);
  return (data ?? []).map((n) => ({ id: n.id, text: n.text, date: n.date, url: n.url ?? undefined, source: "manual" as const }));
}
export async function addNote(n: { text: string; date: string; url?: string }) {
  const { error } = await (await serverClient()).from("notes").insert({ text: n.text, date: n.date, url: n.url ?? null });
  fail(error);
}
export async function deleteNote(id: string) {
  const { error } = await (await serverClient()).from("notes").delete().eq("id", id);
  fail(error);
}

/* ---- messages ---- */
export async function listApprovedMessages(): Promise<PublicMessage[]> {
  const { data, error } = await anonClient().from("messages").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(300);
  fail(error);
  return (data as MRow[]).map((r) => { const { email: _e, status: _s, ...pub } = toMessage(r); return pub; });
}
export async function listMessages(): Promise<Message[]> {
  const { data, error } = await (await serverClient()).from("messages").select("*, message_contacts(email)").order("created_at", { ascending: false }).limit(500);
  fail(error);
  return (data as MRow[]).map(toMessage);
}
/** Envoi public (visiteur anonyme) : le message est toujours créé « en attente ». */
export async function insertMessage(m: Message) {
  const sb = anonClient();
  const { error } = await sb.from("messages").insert({
    id: m.id, kind: m.kind, target_type: m.target?.type ?? null, target_slug: m.target?.slug ?? null,
    name: m.name, subject: m.subject ?? null, body: m.body, status: "pending",
  });
  fail(error);
  if (m.email) {
    const r = await sb.from("message_contacts").insert({ message_id: m.id, email: m.email });
    fail(r.error);
  }
}
export async function updateMessage(id: string, patch: { status?: Message["status"]; reply?: string | null; repliedAt?: string | null }) {
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if ("reply" in patch) row.reply = patch.reply;
  if ("repliedAt" in patch) row.replied_at = patch.repliedAt;
  const { error } = await (await serverClient()).from("messages").update(row).eq("id", id);
  fail(error);
}
export async function removeMessage(id: string) {
  const { error } = await (await serverClient()).from("messages").delete().eq("id", id);
  fail(error);
}
