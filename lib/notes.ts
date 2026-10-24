import sanitizeHtml from "sanitize-html";
import { db } from "./db";
import { get } from "./substack";
import { getSite, isPlaceholder } from "./volumes";
import type { Note } from "./types";

const BASE = process.env.SUBSTACK_NOTES_BASE || "https://substack.com";
const plain = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} }).trim();

export function substackHandle(site: { substackHandle?: string; substackUrl: string }): string | null {
  if (site.substackHandle?.trim()) return site.substackHandle.trim().replace(/^@/, "");
  if (isPlaceholder(site.substackUrl)) return null;
  try {
    const h = new URL(/^https?:/.test(site.substackUrl) ? site.substackUrl : `https://${site.substackUrl}`).hostname;
    return h.endsWith(".substack.com") ? h.replace(".substack.com", "") : null;
  } catch {
    return null;
  }
}

/**
 * Import automatique des Notes : Substack n'a pas d'API officielle pour les Notes, on utilise ses points d'accès
 * publics non documentés. Ils peuvent changer ou refuser les requêtes serveur : en cas d'échec, les notes
 * ajoutées à la main (admin) restent affichées.
 */
export async function fetchSubstackNotes(handle: string, fresh = false): Promise<{ notes: Note[]; error?: string }> {
  try {
    const p = await get(`${BASE}/api/v1/user/${encodeURIComponent(handle)}/public_profile`, fresh);
    if (!p.ok) throw new Error(`profil introuvable (HTTP ${p.status})`);
    const id = (await p.json())?.id;
    if (!id) throw new Error("identifiant du profil absent");
    const f = await get(`${BASE}/api/v1/reader/feed/profile/${id}`, fresh);
    if (!f.ok) throw new Error(`fil d'activité : HTTP ${f.status}`);
    const items: any[] = (await f.json())?.items ?? [];
    const notes: Note[] = [];
    for (const it of items) {
      const c = it?.comment ?? (it?.type === "comment" ? it : null);
      const text = c?.body ? plain(String(c.body)) : "";
      if (!c || !text || (c.user_id && String(c.user_id) !== String(id))) continue;
      notes.push({
        id: `ss-${c.id}`, text: text.slice(0, 1500), date: new Date(c.date ?? it.context?.timestamp ?? Date.now()).toISOString(),
        url: `https://substack.com/@${handle}/note/c-${c.id}`, source: "substack",
      });
    }
    return notes.length ? { notes } : { notes, error: "aucune note publique trouvée" };
  } catch (e) {
    return { notes: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getNotes(limit = 30): Promise<Note[]> {
  const site = await getSite();
  const handle = substackHandle(site);
  const [manual, auto] = await Promise.all([
    db.listNotes().catch(() => [] as Note[]),
    handle ? fetchSubstackNotes(handle) : Promise.resolve({ notes: [] as Note[] }),
  ]);
  const seen = new Set<string>();
  return [...manual, ...auto.notes]
    .filter((n) => { const k = n.url ?? n.id; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, limit);
}
