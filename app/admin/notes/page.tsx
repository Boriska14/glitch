import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/volumes";
import { deleteNote } from "../actions";
import NoteForm from "@/components/admin/NoteForm";
import NotesCheck from "@/components/admin/NotesCheck";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function NotesAdmin() {
  await requireAdmin();
  const notes = await db.listNotes().catch(() => []);
  return (
    <>
      <div className="adm-head"><h1>Notes</h1></div>
      <NotesCheck />
      <NoteForm />
      <h2 style={{ margin: "28px 0 12px" }}>Notes ajoutées à la main ({notes.length})</h2>
      {notes.length === 0 && <p className="adm-muted">Aucune pour l'instant.</p>}
      <ul className="vlist">
        {notes.map((n) => (
          <li key={n.id} className="adm-card">
            <p className="adm-muted small">{formatDate(n.date)}{n.url ? <> · <a href={n.url} target="_blank" rel="noopener noreferrer">lien ↗</a></> : null}</p>
            <p style={{ whiteSpace: "pre-wrap", margin: "6px 0 10px" }}>{n.text}</p>
            <form action={deleteNote}>
              <input type="hidden" name="id" value={n.id} />
              <ConfirmButton className="adm-link danger" message="Supprimer cette note ?">Supprimer</ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
