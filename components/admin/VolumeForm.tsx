"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Uploader from "./Uploader";
import { saveVolume } from "@/app/admin/actions";
import type { Volume } from "@/lib/types";

type Row = Record<string, string>;
const toRows = <T extends object>(a: T[] | undefined, keys: string[]): Row[] =>
  (a ?? []).map((x) => Object.fromEntries(keys.map((k) => [k, String((x as Record<string, unknown>)[k] ?? "")])));

type SetRows = React.Dispatch<React.SetStateAction<Row[]>>;
type Field = { k: string; label: string; placeholder?: string; width?: string; type?: string };

function Repeater({ title, rows, set, fields, addLabel, empty }: { title: string; rows: Row[]; set: SetRows; fields: Field[]; addLabel: string; empty: Row }) {
  const edit = (i: number, k: string, v: string) => set((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i: number, d: -1 | 1) =>
    set((r) => { const j = i + d; if (j < 0 || j >= r.length) return r; const c = [...r]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  return (
    <fieldset className="adm-card">
      <legend>{title}</legend>
      {rows.length === 0 && <p className="adm-muted">Rien pour l'instant.</p>}
      {rows.map((r, i) => (
        <div className="rep-row" key={i}>
          <div className="rep-fields">
            {fields.map((f) => (
              <label key={f.k} style={{ flex: f.width ?? "1 1 200px" }}>
                <span className="label">{f.label}</span>
                <input type={f.type ?? "text"} value={r[f.k] ?? ""} placeholder={f.placeholder} onChange={(e) => edit(i, f.k, e.target.value)} />
              </label>
            ))}
          </div>
          <div className="rep-tools">
            <button type="button" className="adm-link" onClick={() => move(i, -1)} aria-label="Monter" disabled={i === 0}>↑</button>
            <button type="button" className="adm-link" onClick={() => move(i, 1)} aria-label="Descendre" disabled={i === rows.length - 1}>↓</button>
            <button type="button" className="adm-link danger" onClick={() => set((x) => x.filter((_, j) => j !== i))}>Supprimer</button>
          </div>
        </div>
      ))}
      <button type="button" className="adm-btn" onClick={() => set((x) => [...x, { ...empty }])}>+ {addLabel}</button>
    </fieldset>
  );
}

export default function VolumeForm({ initial, isNew, nextNumber, storageEnabled }: { initial?: Volume; isNew: boolean; nextNumber: number; storageEnabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [number, setNumber] = useState(String(initial?.number ?? nextNumber));
  const [status, setStatus] = useState(initial?.status ?? "hidden");
  const [releaseDate, setReleaseDate] = useState(initial?.releaseDate ?? "");
  const [hooks, setHooks] = useState((initial?.hooks ?? []).join("\n"));
  const [handwritten, setHandwritten] = useState(initial?.handwritten ?? "");
  const [editorial, setEditorial] = useState(initial?.editorial ?? "");
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [pdf, setPdf] = useState(initial?.pdf ?? "");
  const [sections, setSections] = useState<Row[]>(toRows(initial?.sections, ["page", "label", "title", "desc"]));
  const [playlists, setPlaylists] = useState<Row[]>(toRows(initial?.playlists, ["title", "url", "note"]));
  const [moodboards, setMoodboards] = useState<Row[]>(toRows(initial?.moodboards, ["title", "url", "note"]));

  const folder = `vol-${String(number || 0).padStart(2, "0")}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = { number: Number(number), status, releaseDate, hooks: hooks.split("\n"), handwritten, editorial, cover, pdf, sections, playlists, moodboards };
    start(async () => {
      const res = await saveVolume(JSON.stringify(payload), isNew);
      if (res.ok) router.push(`/admin?saved=${res.slug}`);
      else { setError(res.error ?? "Échec de l'enregistrement."); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }

  return (
    <form onSubmit={submit} className="vform">
      <div className="adm-head">
        <div>
          <Link href="/admin" className="adm-link">← Volumes</Link>
          <h1>{isNew ? "Nouveau volume" : `Volume ${String(initial?.number).padStart(2, "0")}`}</h1>
        </div>
        <button className="adm-btn primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
      {error && <p className="adm-error box" role="alert">{error}</p>}

      <fieldset className="adm-card">
        <legend>Publication</legend>
        <div className="grid2">
          <label>
            <span className="label">Numéro</span>
            <input type="number" min={1} max={999} required value={number} onChange={(e) => setNumber(e.target.value)} disabled={!isNew} />
            {!isNew && <span className="adm-muted small">Le numéro ne peut plus changer.</span>}
          </label>
          <label>
            <span className="label">Date de sortie</span>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span className="label">Statut</span>
          <div className="radios" role="radiogroup">
            {([
              ["hidden", "Brouillon privé", "Visible uniquement ici, invisible sur le site."],
              ["draft", "Bientôt", "Annoncé sur le site avec la mention « Bientôt »."],
              ["published", "Publié", "En ligne, avec lecture du PDF."],
            ] as const).map(([v, t, d]) => (
              <label key={v} className={`radio ${status === v ? "on" : ""}`}>
                <input type="radio" name="status" value={v} checked={status === v} onChange={() => setStatus(v)} />
                <strong>{t}</strong><span>{d}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="adm-card">
        <legend>Couverture & magazine</legend>
        <Uploader label="Couverture" hint="JPG, PNG ou WebP, format portrait conseillé (ex. 1400 × 1980)." kind="image" folder={folder} value={cover} onChange={setCover} storageEnabled={storageEnabled} />
        <Uploader label="Magazine (PDF)" hint="Le PDF final, jusqu'à 50 Mo. Il s'ouvre en lecture pour les visiteurs quand le volume est publié." kind="pdf" folder={folder} value={pdf} onChange={setPdf} storageEnabled={storageEnabled} />
      </fieldset>

      <fieldset className="adm-card">
        <legend>Textes</legend>
        <label>
          <span className="label">Accroches (une par ligne)</span>
          <textarea rows={4} value={hooks} onChange={(e) => setHooks(e.target.value)} placeholder={"Quand la confidence a besoin d'un prétexte\nQui paie quand on s'ouvre"} />
        </label>
        <label>
          <span className="label">Phrase manuscrite</span>
          <input type="text" value={handwritten} onChange={(e) => setHandwritten(e.target.value)} maxLength={140} />
        </label>
        <label>
          <span className="label">Mot de l'éditrice</span>
          <textarea rows={5} value={editorial} onChange={(e) => setEditorial(e.target.value)} maxLength={2000} />
          <span className="adm-muted small">{editorial.length}/2000</span>
        </label>
      </fieldset>

      <Repeater title="Sommaire" rows={sections} set={setSections} addLabel="Ajouter une rubrique" empty={{ page: "", label: "", title: "", desc: "" }}
        fields={[
          { k: "page", label: "Page", type: "number", width: "0 0 80px" },
          { k: "label", label: "Rubrique", placeholder: "Système", width: "0 1 140px" },
          { k: "title", label: "Titre", width: "2 1 240px" },
          { k: "desc", label: "Descriptif", width: "3 1 280px" },
        ]} />
      <Repeater title="Playlists Spotify" rows={playlists} set={setPlaylists} addLabel="Ajouter une playlist" empty={{ title: "", url: "", note: "" }}
        fields={[
          { k: "title", label: "Titre" },
          { k: "url", label: "Lien Spotify", placeholder: "https://open.spotify.com/playlist/…", width: "2 1 280px" },
          { k: "note", label: "Note (facultatif)" },
        ]} />
      <Repeater title="Moodboards Pinterest" rows={moodboards} set={setMoodboards} addLabel="Ajouter un moodboard" empty={{ title: "", url: "", note: "" }}
        fields={[
          { k: "title", label: "Titre" },
          { k: "url", label: "Lien du board", placeholder: "https://www.pinterest.com/ton-compte/nom-du-board/", width: "2 1 280px" },
          { k: "note", label: "Note (facultatif)" },
        ]} />

      <div className="savebar">
        <button className="adm-btn primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        <Link href="/admin" className="adm-link">Annuler</Link>
      </div>
    </form>
  );
}
