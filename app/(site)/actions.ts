"use server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parseSubmission } from "@/lib/messages";
import { getVolumes } from "@/lib/volumes";

const hits = new Map<string, number[]>();

export type SubmitState = { ok?: boolean; error?: string; values?: Record<string, string> } | undefined;

export async function submitMessage(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  // En cas d'erreur on renvoie ce qui a été saisi : React vide le formulaire après l'action, on ne veut pas perdre le texte.
  const values = Object.fromEntries(["name", "subject", "body", "email"].map((k) => [k, String(form.get(k) ?? "")]));
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 4) return { error: "Tu as déjà envoyé plusieurs messages. Réessaie dans quelques minutes.", values };

  const slugs = (await getVolumes()).map((v) => v.slug);
  const parsed = parseSubmission(form, { validSlugs: slugs });
  if (parsed.spam) return { ok: true }; // on fait croire au robot que c'est passé
  if (!parsed.message) return { error: parsed.error, values };

  try {
    await db.insertMessage(parsed.message);
  } catch {
    return { error: "Impossible d'envoyer ton message pour le moment. Réessaie plus tard.", values };
  }
  hits.set(ip, [...recent, now]);
  return { ok: true };
}
