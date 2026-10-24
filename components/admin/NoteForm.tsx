"use client";
import { useActionState, useRef, useEffect } from "react";
import { addNote } from "@/app/admin/actions";

export default function NoteForm() {
  const [state, action, pending] = useActionState(addNote, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} action={action} className="adm-card">
      <h2>Ajouter une note</h2>
      <label><span className="label">Texte de la note</span><textarea name="text" rows={4} maxLength={1500} required placeholder="Colle ici le texte de ta note Substack…" /></label>
      <div className="grid2">
        <label><span className="label">Date</span><input type="date" name="date" /></label>
        <label><span className="label">Lien vers la note (facultatif)</span><input type="text" inputMode="url" name="url" placeholder="https://substack.com/@…/note/c-…" /></label>
      </div>
      {state?.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="adm-note ok" role="status">Note ajoutée.</p>}
      <button className="adm-btn primary" disabled={pending}>{pending ? "Ajout…" : "Ajouter"}</button>
    </form>
  );
}
