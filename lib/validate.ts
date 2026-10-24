import type { Moodboard, Playlist, Section, Status, Volume } from "./types";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** URL http(s) ou chemin relatif commençant par /. Rejette javascript:, data:, etc. */
export function safeUrl(v: unknown, opts: { host?: RegExp } = {}): string | null {
  const s = clip(v, 600);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return opts.host ? null : s;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (opts.host && !opts.host.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const SPOTIFY_HOST = /(^|\.)spotify\.com$|^spoti\.fi$/i;
export const PINTEREST_HOST = /(^|\.)pinterest\.[a-z.]+$|^pin\.it$/i;

export function parseVolume(input: any, existingNumbers: number[], isNew: boolean): { volume?: Volume; error?: string } {
  const number = Number(input?.number);
  if (!Number.isInteger(number) || number < 1 || number > 999) return { error: "Le numéro du volume doit être un entier entre 1 et 999." };
  if (isNew && existingNumbers.includes(number)) return { error: `Le volume ${number} existe déjà.` };
  const status: Status = ["hidden", "draft", "published"].includes(input?.status) ? input.status : "hidden";

  const cover = safeUrl(input?.cover);
  const pdf = safeUrl(input?.pdf);
  if (cover === null) return { error: "Lien de couverture invalide." };
  if (pdf === null) return { error: "Lien du PDF invalide." };

  const releaseDate = clip(input?.releaseDate, 10);
  if (releaseDate && isNaN(new Date(releaseDate).getTime())) return { error: "Date de sortie invalide." };

  const sections: Section[] = [];
  for (const s of Array.isArray(input?.sections) ? input.sections.slice(0, 40) : []) {
    const title = clip(s?.title, 140);
    if (!title) continue;
    const page = s?.page === "" || s?.page == null ? undefined : Number(s.page);
    if (page !== undefined && (!Number.isInteger(page) || page < 0 || page > 999)) return { error: `Numéro de page invalide pour « ${title} ».` };
    sections.push({ title, page, label: clip(s?.label, 40) || undefined, desc: clip(s?.desc, 300) || undefined });
  }

  const playlists: Playlist[] = [];
  for (const p of Array.isArray(input?.playlists) ? input.playlists.slice(0, 20) : []) {
    const url = safeUrl(p?.url, { host: SPOTIFY_HOST });
    if (!clip(p?.url, 600) && !clip(p?.title, 100)) continue;
    if (!url) return { error: `Lien Spotify invalide pour « ${clip(p?.title, 60) || "playlist"} ». Colle un lien open.spotify.com/…` };
    playlists.push({ title: clip(p?.title, 100) || "Playlist", url, note: clip(p?.note, 200) || undefined });
  }

  const moodboards: Moodboard[] = [];
  for (const m of Array.isArray(input?.moodboards) ? input.moodboards.slice(0, 20) : []) {
    const url = safeUrl(m?.url, { host: PINTEREST_HOST });
    if (!clip(m?.url, 600) && !clip(m?.title, 100)) continue;
    if (!url) return { error: `Lien Pinterest invalide pour « ${clip(m?.title, 60) || "moodboard"} ». Colle un lien pinterest.com/…` };
    moodboards.push({ title: clip(m?.title, 100) || "Moodboard", url, note: clip(m?.note, 200) || undefined });
  }

  const hooks = (Array.isArray(input?.hooks) ? input.hooks : []).map((h: unknown) => clip(h, 140)).filter(Boolean).slice(0, 6);

  return {
    volume: {
      slug: `vol-${String(number).padStart(2, "0")}`,
      number,
      title: "GLITCH",
      status,
      releaseDate: releaseDate || undefined,
      hooks,
      handwritten: clip(input?.handwritten, 140) || undefined,
      editorial: clip(input?.editorial, 2000) || undefined,
      cover: cover || undefined,
      pdf: pdf || undefined,
      sections,
      playlists,
      moodboards,
    },
  };
}
