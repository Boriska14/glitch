import { db } from "@/lib/db";
import { formatDate } from "@/lib/volumes";
import MessageForm from "./MessageForm";
import type { PublicMessage } from "@/lib/types";

export default async function Comments({ type, slug }: { type: "volume" | "post"; slug: string }) {
  const all: PublicMessage[] = await db.listApprovedMessages().catch(() => []);
  const list = all.filter((m) => m.kind === "comment" && m.target?.type === type && m.target.slug === slug).reverse();
  return (
    <section className="page narrow comments" aria-label="Commentaires">
      <header className="sec-head"><h2>Commentaires <span className="count">{list.length}</span></h2></header>
      {list.length > 0 && (
        <ul className="comment-list">
          {list.map((m) => (
            <li key={m.id}>
              <p className="c-meta"><strong>{m.name}</strong> · <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time></p>
              <p className="c-body">{m.body}</p>
              {m.reply && <p className="c-reply"><strong>Réponse de l'éditrice.</strong> {m.reply}</p>}
            </li>
          ))}
        </ul>
      )}
      <MessageForm kind="comment" targetType={type} targetSlug={slug} title="Laisser un commentaire" cta="Envoyer" />
    </section>
  );
}
