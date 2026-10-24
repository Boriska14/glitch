import type { Metadata } from "next";
import PostRow from "@/components/PostCard";
import NoteCards from "@/components/NoteCard";
import { getFeed } from "@/lib/substack";
import { getNotes } from "@/lib/notes";
import { getSite, isPlaceholder } from "@/lib/volumes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Journal" };

export default async function Journal() {
  const [feed, site, notes] = await Promise.all([getFeed(), getSite(), getNotes(30)]);
  const configured = !isPlaceholder(site.substackUrl);
  return (
    <>
      <section className="page">
        <header className="sec-head solo">
          <h1 className="page-title">Journal</h1>
          {configured && <a className="textlink" href={site.substackUrl} target="_blank" rel="noopener noreferrer">S'abonner sur Substack ↗</a>}
        </header>
        {feed.posts.length ? (
          <ul className="post-list">{feed.posts.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
        ) : configured ? (
          <p className="lede">Impossible d'afficher les articles pour le moment. Tu peux les lire directement sur <a href={site.substackUrl} target="_blank" rel="noopener noreferrer">Substack ↗</a>.</p>
        ) : (
          <p className="lede muted">Les premiers textes arrivent bientôt.</p>
        )}
      </section>
      {notes.length > 0 && (
        <section className="page" id="notes">
          <header className="sec-head"><h2>Notes</h2><span className="sec-meta">Pensées courtes, côté Substack</span></header>
          <NoteCards notes={notes} />
        </section>
      )}
    </>
  );
}
