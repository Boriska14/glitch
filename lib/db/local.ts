import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Message, Note, PublicMessage, Settings, Volume } from "@/lib/types";

/** Pilote de développement / test : tout est gardé dans .data/db.json. Inactif en production. */
const FILE = path.join(process.cwd(), ".data", "db.json");
type DB = { volumes: Record<string, Volume>; settings: Settings; notes: Note[]; messages: Message[] };
const empty = (): DB => ({ volumes: {}, settings: {}, notes: [], messages: [] });

async function read(): Promise<DB> {
  try { return { ...empty(), ...JSON.parse(await fs.readFile(FILE, "utf8")) }; } catch { return empty(); }
}
async function write(db: DB) {
  if (process.env.NODE_ENV === "production" && !process.env.GLITCH_LOCAL_STORE) {
    throw new Error("Base de données non configurée : renseigne content/supabase.json (voir le README).");
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}

export async function listVolumes(_admin: boolean) { return Object.values((await read()).volumes).sort((a, b) => b.number - a.number); }
export async function upsertVolume(v: Volume) { const d = await read(); d.volumes[v.slug] = v; await write(d); }
export async function deleteVolume(slug: string) { const d = await read(); delete d.volumes[slug]; await write(d); }

export async function getSettings(_admin = false) { return (await read()).settings; }
export async function saveSettings(s: Settings) { const d = await read(); d.settings = s; await write(d); }

export async function listNotes() { return (await read()).notes.sort((a, b) => +new Date(b.date) - +new Date(a.date)); }
export async function addNote(n: { text: string; date: string; url?: string }) {
  const d = await read(); d.notes.push({ id: crypto.randomUUID(), text: n.text, date: n.date, url: n.url, source: "manual" }); await write(d);
}
export async function deleteNote(id: string) { const d = await read(); d.notes = d.notes.filter((n) => n.id !== id); await write(d); }

export async function listApprovedMessages(): Promise<PublicMessage[]> {
  return (await read()).messages.filter((m) => m.status === "approved")
    .map(({ email: _e, status: _s, ...pub }) => pub).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
export async function listMessages() { return (await read()).messages.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); }
export async function insertMessage(m: Message) { const d = await read(); d.messages.push({ ...m, status: "pending" }); await write(d); }
export async function updateMessage(id: string, patch: { status?: Message["status"]; reply?: string | null; repliedAt?: string | null }) {
  const d = await read();
  d.messages = d.messages.map((m) => m.id !== id ? m : {
    ...m, ...(patch.status ? { status: patch.status } : {}),
    ...("reply" in patch ? { reply: patch.reply ?? undefined } : {}), ...("repliedAt" in patch ? { repliedAt: patch.repliedAt ?? undefined } : {}),
  });
  await write(d);
}
export async function removeMessage(id: string) { const d = await read(); d.messages = d.messages.filter((m) => m.id !== id); await write(d); }
