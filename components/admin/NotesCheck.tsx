"use client";
import { useState, useTransition } from "react";
import { testNotes } from "@/app/admin/actions";

export default function NotesCheck() {
  const [res, setRes] = useState<{ ok: boolean; message: string }>();
  const [busy, start] = useTransition();
  return (
    <div className="adm-card">
      <h2>Import automatique</h2>
      <p className="adm-muted">Le site essaie de récupérer tes Notes publiques depuis Substack (service non officiel, donc non garanti). Les notes ajoutées à la main s'affichent dans tous les cas.</p>
      <button type="button" className="adm-btn" disabled={busy} onClick={() => start(async () => setRes(await testNotes()))}>{busy ? "Test…" : "Tester l'import"}</button>
      {res && <div className={`adm-note ${res.ok ? "ok" : "bad"}`} style={{ marginTop: 14 }} role="status">{res.message}</div>}
    </div>
  );
}
