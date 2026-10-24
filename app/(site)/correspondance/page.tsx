import type { Metadata } from "next";
import MessageForm from "@/components/MessageForm";
import { Sun } from "@/components/Motifs";
import { db } from "@/lib/db";
import { getSite, formatDate } from "@/lib/volumes";
import type { PublicMessage } from "@/lib/types";

export const revalidate = 300;
export const metadata: Metadata = { title: "Correspondance", description: "Écris à GLITCH : les lettres choisies sont publiées avec une réponse." };

export default async function Correspondance() {
  const [site, all] = await Promise.all([getSite(), db.listApprovedMessages().catch(() => [] as PublicMessage[])]);
  const letters = all.filter((m) => m.kind === "letter");
  return (
    <>
      <section className="page corr-head">
        <div>
          <p className="kicker">Courrier des lecteurs</p>
          <h1 className="page-title">Correspondance</h1>
          <p className="lede">Une confidence, une question, un désaccord ? Écris à GLITCH. Les lettres retenues sont publiées ici (et parfois dans le magazine), avec une réponse.</p>
          {site.letterTopic && <p className="topic"><span>Sujet du volume</span>{site.letterTopic}</p>}
        </div>
        <Sun className="corr-sun" />
      </section>

      <section className="page narrow"><MessageForm kind="letter" title="Écrire à GLITCH" cta="Envoyer ma lettre" /></section>

      <section className="page">
        <header className="sec-head"><h2>Lettres publiées</h2><span className="sec-meta">{letters.length}</span></header>
        {letters.length === 0 ? (
          <p className="lede muted">Les premières lettres arrivent bientôt. Sois la première personne à écrire.</p>
        ) : (
          <ul className="letters">
            {letters.map((m) => (
              <li key={m.id} className="letter">
                {m.subject && <p className="chip">{m.subject}</p>}
                <p className="l-body">{m.body}</p>
                <p className="l-from">— {m.name}, <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time></p>
                {m.reply && <p className="l-reply"><strong>Réponse de {site.author}</strong>{m.reply}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
