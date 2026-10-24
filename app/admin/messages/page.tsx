import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/volumes";
import { moderate } from "../actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import type { Message } from "@/lib/types";

const TABS: [string, string][] = [["pending", "En attente"], ["approved", "Publiés"], ["rejected", "Refusés"], ["all", "Tous"]];
const KINDS: [string, string][] = [["all", "Tout"], ["letter", "Courrier"], ["comment", "Commentaires"]];

const where = (m: Message) => m.kind === "letter" ? "Courrier" : m.target?.type === "post" ? `Commentaire · article « ${m.target.slug} »` : `Commentaire · ${m.target?.slug ?? ""}`;

export default async function Messages({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requireAdmin();
  const { status = "pending", kind = "all" } = await searchParams;
  const all = await db.listMessages().catch(() => [] as Message[]);
  const count = (s: string) => all.filter((m) => s === "all" || m.status === s).length;
  const rows = all.filter((m) => (status === "all" || m.status === status) && (kind === "all" || m.kind === kind));
  const q = (s: string, k: string) => `/admin/messages?status=${s}&kind=${k}`;

  return (
    <>
      <div className="adm-head"><h1>Messages</h1></div>
      <nav className="tabs" aria-label="Filtrer par statut">
        {TABS.map(([s, l]) => <Link key={s} href={q(s, kind)} className={status === s ? "on" : ""}>{l} <span>{count(s)}</span></Link>)}
      </nav>
      <nav className="tabs sub" aria-label="Filtrer par type">
        {KINDS.map(([k, l]) => <Link key={k} href={q(status, k)} className={kind === k ? "on" : ""}>{l}</Link>)}
      </nav>

      {rows.length === 0 && <p className="adm-muted">Aucun message ici.</p>}
      <ul className="vlist">
        {rows.map((m) => (
          <li key={m.id} className="adm-card msg">
            <div className="msg-head">
              <strong>{m.name}</strong>
              <span className={`pill ${m.status === "approved" ? "published" : m.status === "pending" ? "draft" : "hidden"}`}>{m.status === "approved" ? "Publié" : m.status === "pending" ? "En attente" : "Refusé"}</span>
            </div>
            <p className="adm-muted small">{where(m)} · {formatDate(m.createdAt)}{m.email ? <> · <a href={`mailto:${m.email}`}>{m.email}</a> (privé)</> : null}</p>
            {m.subject && <p><strong>Sujet : {m.subject}</strong></p>}
            <p className="msg-body">{m.body}</p>
            {m.reply && <p className="msg-reply"><strong>Ta réponse :</strong> {m.reply}</p>}

            <details>
              <summary>{m.reply ? "Modifier ma réponse" : "Répondre publiquement"}</summary>
              <form action={moderate}>
                <input type="hidden" name="id" value={m.id} /><input type="hidden" name="op" value="reply" />
                <label className="sr-only" htmlFor={`r-${m.id}`}>Réponse</label>
                <textarea id={`r-${m.id}`} name="reply" rows={3} maxLength={1500} defaultValue={m.reply ?? ""} placeholder="Ta réponse (le message est publié avec elle)." />
                <button className="adm-btn">Enregistrer la réponse</button>
              </form>
            </details>

            <div className="msg-actions">
              {m.status !== "approved" && <form action={moderate}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="op" value="approve" /><button className="adm-btn primary">Publier</button></form>}
              {m.status !== "rejected" && <form action={moderate}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="op" value="reject" /><button className="adm-btn">Refuser</button></form>}
              {m.status === "approved" && <form action={moderate}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="op" value="pending" /><button className="adm-link">Dépublier</button></form>}
              <form action={moderate}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="op" value="delete" /><ConfirmButton className="adm-link danger" message="Supprimer définitivement ce message ?">Supprimer</ConfirmButton></form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
