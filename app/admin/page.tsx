import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAllVolumes, getSite, isPlaceholder, formatDate, pad } from "@/lib/volumes";
import { db, usingSupabase } from "@/lib/db";
import { fetchPosts } from "@/lib/substack";
import { setStatus, deleteVolume } from "./actions";
import ConfirmButton from "@/components/admin/ConfirmButton";

const LABEL = { hidden: "Brouillon privé", draft: "Bientôt", published: "Publié" } as const;

async function Inbox() {
  const msgs = await db.listMessages().catch(() => []);
  const n = msgs.filter((m) => m.status === "pending").length;
  return n > 0 ? (
    <div className="adm-note bad"><strong>{n} message{n > 1 ? "s" : ""} en attente de relecture.</strong> <Link href="/admin/messages?status=pending">Ouvrir la boîte de réception →</Link></div>
  ) : null;
}

async function SubstackStatus() {
  const site = await getSite(true);
  if (isPlaceholder(site.substackUrl)) {
    return <div className="adm-note bad"><strong>Substack non relié.</strong> Ajoute ton adresse dans <Link href="/admin/settings">Réglages</Link> pour afficher tes articles.</div>;
  }
  const r = await fetchPosts(site.substackUrl, true);
  return r.posts.length ? (
    <div className="adm-note ok"><strong>Substack connecté</strong> · {r.posts.length} article(s) lus via {r.source === "rss" ? "le flux RSS" : "l'API"} depuis {r.origin}.</div>
  ) : (
    <div className="adm-note bad"><strong>Substack : aucun article lu.</strong> {r.error} <Link href="/admin/settings">Vérifier l'adresse</Link></div>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const volumes = await getAllVolumes(true);

  return (
    <>
      <div className="adm-head">
        <h1>Volumes</h1>
        <Link href="/admin/volumes/new" className="adm-btn primary">+ Nouveau volume</Link>
      </div>

      {saved && <p className="adm-note ok" role="status">Volume {saved.replace("vol-", "")} enregistré. Le site est à jour.</p>}
      {!usingSupabase && (
        <p className="adm-note bad">
          <strong>Supabase n'est pas relié.</strong>{" "}
          {process.env.NODE_ENV === "production"
            ? "Les volumes créés ici ne seront pas conservés. Suis l'étape 3 du README pour relier ta base."
            : "Mode local : les données sont gardées dans .data/ ; l'envoi de fichiers nécessite Supabase."}
        </p>
      )}
      <Suspense fallback={null}><Inbox /></Suspense>

      <Suspense fallback={<div className="adm-note">Vérification de Substack…</div>}><SubstackStatus /></Suspense>

      <ul className="vlist">
        {volumes.map((v) => (
          <li key={v.slug} className="adm-card vrow">
            <div className="vthumb">{v.cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.cover} alt="" /> : <span>{pad(v.number)}</span>}</div>
            <div className="vinfo">
              <h2>Volume {pad(v.number)}</h2>
              <p className="adm-muted small">
                {v.status === "published" ? formatDate(v.releaseDate) || "Publié" : LABEL[v.status]} · {v.sections.length} rubrique(s) · {v.playlists.length} playlist(s) · {v.moodboards.length} moodboard(s)
                {v.pdf ? " · PDF ✓" : ""}
              </p>
              <form action={setStatus} className="status-form">
                <input type="hidden" name="slug" value={v.slug} />
                <label className="sr-only" htmlFor={`st-${v.slug}`}>Statut</label>
                <select id={`st-${v.slug}`} name="status" defaultValue={v.status} className={`pill ${v.status}`}>
                  <option value="hidden">Brouillon privé</option>
                  <option value="draft">Bientôt</option>
                  <option value="published">Publié</option>
                </select>
                <button className="adm-link">Appliquer</button>
              </form>
            </div>
            <div className="vactions">
              <Link href={`/admin/volumes/${v.slug}`} className="adm-btn">Modifier</Link>
              {v.status !== "hidden" && <Link href={`/volumes/${v.slug}`} target="_blank" className="adm-link">Voir ↗</Link>}
              {v.origin !== "file" && (
                <form action={deleteVolume}>
                  <input type="hidden" name="slug" value={v.slug} />
                  <ConfirmButton className="adm-link danger" message={`Supprimer le volume ${pad(v.number)} ? Cette action est définitive.`}>
                    {v.origin === "both" ? "Rétablir l'original" : "Supprimer"}
                  </ConfirmButton>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
