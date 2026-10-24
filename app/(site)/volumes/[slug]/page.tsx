import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import VolumeCover from "@/components/VolumeCover";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import PinterestBoard from "@/components/PinterestBoard";
import Comments from "@/components/Comments";
import MagazineReader, { PageLink } from "@/components/MagazineReader";
import { getVolume, pad, formatDate, getSite, isPlaceholder } from "@/lib/volumes";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await getVolume((await params).slug);
  return v ? { title: `Volume ${pad(v.number)}`, description: v.hooks.join(" · ") } : {};
}

export default async function VolumePage({ params }: { params: Promise<{ slug: string }> }) {
  const [v, site] = await Promise.all([params.then((p) => getVolume(p.slug)), getSite()]);
  if (!v) notFound();
  const published = v.status === "published";

  return (
    <>
      <section className="page volume-head">
        <div className="vh-cover"><VolumeCover v={v} priority /></div>
        <div className="vh-info">
          <p className="kicker">{published ? formatDate(v.releaseDate) || "Disponible" : "En préparation"}</p>
          <h1 className="page-title">GLITCH<br /><em>Volume {pad(v.number)}</em></h1>
          {v.hooks.length > 0 && <ul className="hooks">{v.hooks.map((h) => <li key={h}>{h}</li>)}</ul>}
          {v.editorial && <p className="editorial">{v.editorial}</p>}
          <div className="actions">
            {published && v.pdf && <a className="btn" href="#lecteur">Feuilleter le magazine ↓</a>}
            {!published && <span className="tag">Bientôt disponible</span>}
            <Link className="textlink" href="/volumes">← Tous les volumes</Link>
          </div>
        </div>
      </section>

      {published && v.pdf && (
        <section className="page reader-sec" id="lecteur" aria-label={`Lecture du volume ${pad(v.number)}`}>
          <header className="sec-head">
            <h2>Lire le volume {pad(v.number)}</h2>
          </header>
          <MagazineReader url={v.pdf} title={`GLITCH, volume ${pad(v.number)}`} />
        </section>
      )}

      {v.sections.length > 0 && (
        <section className="page">
          <header className="sec-head"><h2>Au sommaire</h2></header>
          <ol className="toc">
            {v.sections.map((s) => (
              <li key={s.title}>
                <span className="toc-page">{s.page === undefined ? "·" : published && v.pdf ? <PageLink page={s.page}>{pad(s.page)}</PageLink> : pad(s.page)}</span>
                <div>
                  {s.label && <span className="toc-label">{s.label}</span>}
                  <h3>{s.title}</h3>
                  {s.desc && <p>{s.desc}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {v.playlists.length > 0 && (
        <section className="page">
          <header className="sec-head">
            <h2>La bande-son</h2>
            {!isPlaceholder(site.spotifyProfileUrl) && <a className="textlink" href={site.spotifyProfileUrl} target="_blank" rel="noopener noreferrer">Mon profil Spotify ↗</a>}
          </header>
          <div className="embed-grid">{v.playlists.map((p) => <SpotifyEmbed key={p.url} p={p} />)}</div>
        </section>
      )}

      {v.moodboards.length > 0 && (
        <section className="page">
          <header className="sec-head">
            <h2>Moodboards</h2>
            {!isPlaceholder(site.pinterestProfileUrl) && <a className="textlink" href={site.pinterestProfileUrl} target="_blank" rel="noopener noreferrer">Mon compte Pinterest ↗</a>}
          </header>
          <div className="embed-grid">{v.moodboards.map((m) => <PinterestBoard key={m.url} m={m} />)}</div>
        </section>
      )}
      <Comments type="volume" slug={v.slug} />
    </>
  );
}
