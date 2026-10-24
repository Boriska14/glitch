import crypto from "node:crypto";
import type { Message } from "./types";

const clip = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const LINKS = /(https?:\/\/|www\.)/gi;

export type Parsed = { message?: Message; error?: string; spam?: boolean };

/** Valide un envoi public (correspondance ou commentaire). Anti-spam : champ piège, délai minimum, liens limités. */
export function parseSubmission(f: FormData, opts: { validSlugs?: string[] } = {}): Parsed {
  if (clip(f.get("website"), 200)) return { spam: true }; // champ piège rempli par les robots
  const ts = Number(f.get("ts"));
  const age = Date.now() - ts;
  if (!ts || age < 3000) return { error: "Un instant… relis ton message puis renvoie-le." };
  if (age > 6 * 3600_000) return { error: "Le formulaire a expiré, recharge la page." };

  const kind = f.get("kind") === "letter" ? "letter" : "comment";
  const name = clip(f.get("name"), 60);
  const body = clip(f.get("body"), 1500);
  const subject = clip(f.get("subject"), 120);
  const email = clip(f.get("email"), 200);

  if (!name) return { error: "Indique un prénom ou un pseudo." };
  if (body.length < 10) return { error: "Ton message est un peu court (10 caractères minimum)." };
  if ((body.match(LINKS) ?? []).length > 1) return { error: "Les liens ne sont pas acceptés dans les messages." };
  if (email && !EMAIL.test(email)) return { error: "Adresse e-mail invalide (ou laisse le champ vide)." };

  let target: Message["target"];
  if (kind === "comment") {
    const type = f.get("targetType") === "post" ? "post" : "volume";
    const slug = clip(f.get("targetSlug"), 200);
    if (!slug) return { error: "Commentaire sans destination." };
    if (type === "volume" && opts.validSlugs && !opts.validSlugs.includes(slug)) return { error: "Volume introuvable." };
    target = { type, slug };
  }

  return {
    message: {
      id: crypto.randomUUID(), kind, target, name, subject: kind === "letter" ? subject || undefined : undefined,
      body, email: email || undefined, status: "pending", createdAt: new Date().toISOString(),
    },
  };
}
