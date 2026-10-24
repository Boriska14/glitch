import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";
import { getSite, isPlaceholder } from "./volumes";
import type { Post } from "./types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: true });

// Substack/Cloudflare refuse parfois les requêtes serveur sans User-Agent de navigateur.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; GlitchMagazine/1.0; +https://vercel.com) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Accept: "application/rss+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
};

export type FeedResult = { posts: Post[]; origin?: string; source?: "rss" | "api"; error?: string };

/** Accepte « monnom », « monnom.substack.com », « https://monnom.substack.com/archive », « substack.com/@monnom », un domaine perso… */
export function normalizeSubstackUrl(input: string): string | null {
  let s = (input ?? "").trim();
  if (!s || /VOTRE-/.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = /^[a-z0-9-]+$/i.test(s) ? `https://${s}.substack.com` : `https://${s}`;
  try {
    const u = new URL(s);
    const at = u.pathname.match(/^\/@([a-z0-9_-]+)/i);
    if (/(^|\.)substack\.com$/i.test(u.hostname) && u.hostname.toLowerCase() === "substack.com" && at) return `https://${at[1].toLowerCase()}.substack.com`;
    if (u.hostname.toLowerCase().startsWith("open.")) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const clean = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption", "h1", "h2"],
    allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "width", "height"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }) },
  });
const strip = (html: string) => sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();

export function get(url: string, fresh: boolean) {
  return fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(9000),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 900, tags: ["substack"] } }),
  });
}

async function viaRss(origin: string, fresh: boolean): Promise<Post[]> {
  const res = await get(`${origin}/feed`, fresh);
  if (!res.ok) throw new Error(`flux RSS : HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes("<rss") && !text.includes("<feed")) throw new Error("flux RSS : réponse inattendue (page de protection ?)");
  const raw = parser.parse(text)?.rss?.channel?.item ?? [];
  return (Array.isArray(raw) ? raw : [raw]).filter((it: any) => it?.link).map((it: any): Post => {
    const link = String(it.link);
    return {
      slug: link.split("/p/")[1]?.split(/[?#]/)[0] ?? encodeURIComponent(String(it.title)),
      title: String(it.title),
      link,
      date: new Date(it.pubDate).toISOString(),
      excerpt: strip(String(it.description ?? "")).slice(0, 240),
      html: clean(String(it["content:encoded"] ?? it.description ?? "")),
      image: it.enclosure?.["@_url"],
    };
  });
}

async function viaApi(origin: string, fresh: boolean): Promise<Post[]> {
  const res = await get(`${origin}/api/v1/archive?sort=new&limit=20`, fresh);
  if (!res.ok) throw new Error(`API archive : HTTP ${res.status}`);
  const data = (await res.json()) as any[];
  if (!Array.isArray(data)) throw new Error("API archive : réponse inattendue");
  return data.map((p): Post => ({
    slug: String(p.slug),
    title: String(p.title),
    link: String(p.canonical_url ?? `${origin}/p/${p.slug}`),
    date: new Date(p.post_date).toISOString(),
    excerpt: strip(String(p.subtitle || p.description || "")).slice(0, 240),
    html: "",
    image: p.cover_image || undefined,
  }));
}

/** Essaie le flux RSS, puis l'API publique ; renvoie une erreur lisible plutôt que de se taire. */
export async function fetchPosts(input: string, fresh = false): Promise<FeedResult> {
  const origin = normalizeSubstackUrl(input);
  if (!origin) return { posts: [], error: "Adresse Substack manquante ou illisible." };
  const errors: string[] = [];
  for (const [source, fn] of [["rss", viaRss], ["api", viaApi]] as const) {
    try {
      const posts = await fn(origin, fresh);
      if (posts.length) return { posts, origin, source };
      errors.push(`${source === "rss" ? "flux RSS" : "API"} : aucun article trouvé`);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { posts: [], origin, error: errors.join(" · ") };
}

export async function getFeed(): Promise<FeedResult> {
  const site = await getSite();
  if (isPlaceholder(site.substackUrl)) return { posts: [], error: "Adresse Substack non renseignée." };
  return fetchPosts(site.substackUrl);
}

export async function getPosts(): Promise<Post[]> {
  return (await getFeed()).posts;
}

/** Récupère le texte complet d'un article quand le flux n'en fournit pas (repli API). */
export async function getPost(slug: string): Promise<Post | undefined> {
  const feed = await getFeed();
  const post = feed.posts.find((p) => p.slug === slug);
  if (!post || post.html || !feed.origin) return post;
  try {
    const res = await get(`${feed.origin}/api/v1/posts/${encodeURIComponent(slug)}`, false);
    if (res.ok) {
      const d = (await res.json()) as any;
      if (d?.body_html) return { ...post, html: clean(String(d.body_html)) };
    }
  } catch {}
  return post;
}
