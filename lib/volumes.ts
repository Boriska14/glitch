import fs from "node:fs";
import path from "node:path";
import site from "@/content/site.json";
import { db } from "./db";
import type { Settings, SiteConfig, Volume } from "./types";

const DIR = path.join(process.cwd(), "content", "volumes");
export type VolumeRow = Volume & { origin: "file" | "admin" | "both" };

function seedVolumes(): Volume[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => ({
    hooks: [], sections: [], playlists: [], moodboards: [], status: "draft", title: "GLITCH",
    ...JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")),
    slug: f.replace(/\.json$/, ""),
  })) as Volume[];
}

/** Volumes du dépôt (content/volumes) + volumes de la base (la base l'emporte à slug égal). `admin` = voir aussi les brouillons privés. */
export async function getAllVolumes(admin = false): Promise<VolumeRow[]> {
  let stored: Volume[] = [];
  try { stored = await db.listVolumes(admin); } catch (e) { if (admin) throw e; }
  const map = new Map<string, VolumeRow>();
  for (const v of seedVolumes()) map.set(v.slug, { ...v, origin: "file" });
  for (const v of stored) map.set(v.slug, { ...v, origin: map.has(v.slug) ? "both" : "admin" });
  return [...map.values()].sort((a, b) => b.number - a.number);
}

export async function getVolumes(): Promise<Volume[]> {
  return (await getAllVolumes(false)).filter((v) => v.status !== "hidden");
}
export async function getVolume(slug: string) {
  return (await getVolumes()).find((v) => v.slug === slug);
}

export async function getSite(admin = false): Promise<SiteConfig> {
  let saved: Settings = {};
  try { saved = await db.getSettings(admin); } catch { /* base indisponible : valeurs par défaut */ }
  const env = process.env.SUBSTACK_URL;
  const merged = { ...(site as SiteConfig), ...(env ? { substackUrl: env } : {}) } as Record<string, unknown>;
  for (const [k, v] of Object.entries(saved)) if (typeof v === "string" && v.trim()) merged[k] = v.trim();
  return merged as unknown as SiteConfig;
}

export const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function spotifyEmbed(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|show|episode|artist)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator` : null;
}

export const isPlaceholder = (url?: string) => !url || /VOTRE-/.test(url);
