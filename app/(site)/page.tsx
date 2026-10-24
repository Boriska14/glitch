import Link from "next/link";
import VolumeCover from "@/components/VolumeCover";
import PostRow from "@/components/PostCard";
import NoteCards from "@/components/NoteCard";
import { Sun, Comb, Cowrie, Triangles } from "@/components/Motifs";
import { getVolumes, getSite, pad, formatDate, isPlaceholder } from "@/lib/volumes";
import { getFeed } from "@/lib/substack";
import { getNotes } from "@/lib/notes";

export const revalidate = 300;
const RUBRIQUES = ["Système", "Corps", "Machine", "Esprit", "Culture", "Fun"];

export default async function Home() {
  const [volumes, site, feed, notes] = await Promise.all([getVolumes(), getSite(), getFeed(), getNotes(6)]);
  const latest = volumes[0];
  const posts = feed.posts.slice(0, 4);
  const hasSubstack = !isPlaceholder(site.substackUrl);
  const live = latest?.status === "published";

  return (
    <>
      <section className="hero page">
        <div className="hero-text">
          <p className="kicker">Magazine · {site.tagline}</p>
          <h1 className="wordmark">GLITCH</h1>
          <p className="statement">Quand la confidence a besoin d'un prétexte.</p>
          <p className="signature">par {site.author}</p>
          <ul className="chips" aria-label="Rubriques">{RUBRIQUES.map((r) => <li key={r} className="chip">{r}</li>)}</ul>
          {latest && (
            <div className="actions">
              <Link className="btn" href={`/volumes/${latest.slug}`}>{live ? `Lire le volume ${pad(latest.number)}` : `Volume ${pad(latest.number)} · bientôt`}</Link>
              {volumes.length > 1 && <Link className="textlink" href="/volumes">Tous les volumes →</Link>}
            </div>
          )}
        </div>
        <div className="collage" aria-hidden={!latest}>
          <div className="tile t-cobalt"><Sun className="m" /></div>
          <div className="tile t-rust"><Comb className="m" /></div>
          <div className="tile t-sand"><Cowrie className="m" /></div>
          <div className="tile t-red"><Triangles className="m wide" /></div>
          {latest && (
            <Link href={`/volumes/${latest.slug}`} className="hero-cover" aria-label={`Volume ${pad(latest.number)}`}>
              <VolumeCover v={latest} priority />
            </Link>
          )}
        </div>
      </section>

      {latest && latest.sections.length > 0 && (
        <section className="page">
          <header className="sec-head">
            <h2>Au sommaire</h2>
            <span className="sec-meta">Volume {pad(latest.number)}{live && latest.releaseDate ? ` · ${formatDate(latest.releaseDate)}` : ""}</span>
          </header>
          <ol className="toc">
            {latest.sections.map((s) => (
              <li key={s.title}>
                <span className="toc-page">{s.page !== undefined ? pad(s.page) : "·"}</span>
                <div>
                  {s.label && <span className="chip small">{s.label}</span>}
                  <h3>{s.title}</h3>
                  {s.desc && <p>{s.desc}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasSubstack && (
        <section className="page">
          <header className="sec-head">
            <h2>Dans le journal</h2>
            <Link className="textlink" href="/journal">Tous les articles →</Link>
          </header>
          {posts.length ? (
            <ul className="post-list">{posts.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
          ) : (
            <p className="lede muted">Les derniers textes sont à lire directement sur <a href={site.substackUrl} target="_blank" rel="noopener noreferrer">Substack ↗</a>.</p>
          )}
        </section>
      )}

      {notes.length > 0 && (
        <section className="page">
          <header className="sec-head">
            <h2>Notes</h2>
            <Link className="textlink" href="/journal#notes">Toutes les notes →</Link>
          </header>
          <NoteCards notes={notes} />
        </section>
      )}

      <section className="panel rust">
        <Comb className="panel-motif" />
        <div className="page">
          <p className="kicker">Correspondance</p>
          <h2>Une confidence, une question&nbsp;?<br />Écris à GLITCH.</h2>
          <Link className="btn light" href="/correspondance">Écrire une lettre →</Link>
        </div>
      </section>

      {hasSubstack && (
        <section className="panel cobalt">
          <Sun className="panel-motif" />
          <div className="page">
            <p className="kicker">La newsletter</p>
            <h2>Reçois les nouveaux textes<br />dès leur sortie.</h2>
            <a className="btn light" href={site.substackUrl} target="_blank" rel="noopener noreferrer">S'abonner sur Substack ↗</a>
          </div>
        </section>
      )}
    </>
  );
}
