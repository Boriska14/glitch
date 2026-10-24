"use client";
import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

type Props = { label: string; hint?: string; value: string; onChange: (v: string) => void; kind: "image" | "pdf"; folder: string; storageEnabled: boolean };

export default function Uploader({ label, hint, value, onChange, kind, folder, storageEnabled }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const accept = kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "application/pdf";

  async function onFile(file: File) {
    setError("");
    if (file.size > 50 * 1024 * 1024) return setError("Fichier trop lourd : 50 Mo maximum (limite du plan gratuit Supabase). Compresse le PDF.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (kind === "pdf" ? "pdf" : "jpg");
      const path = `volumes/${folder}/${kind}-${Date.now()}.${ext}`;
      const sb = browserClient();
      const { error: e } = await sb.storage.from("media").upload(path, file, { contentType: file.type, upsert: true, cacheControl: "3600" });
      if (e) throw new Error(e.message);
      onChange(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      {hint && <span className="adm-muted small">{hint}</span>}
      <div className={`uploader ${kind}`}>
        {value && kind === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="Aperçu" />}
        {value && kind === "pdf" && <a href={value} target="_blank" rel="noopener noreferrer">PDF envoyé ↗</a>}
        <div className="uploader-actions">
          {storageEnabled ? (
            <>
              <button type="button" className="adm-btn" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Envoi en cours…" : value ? "Remplacer" : "Choisir un fichier"}</button>
              <input ref={input} type="file" accept={accept} hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </>
          ) : (
            <span className="adm-muted small">Envoi de fichiers indisponible (Supabase non relié) : colle un lien ci-dessous.</span>
          )}
          {value && <button type="button" className="adm-link" onClick={() => onChange("")}>Retirer</button>}
        </div>
      </div>
      <input type="text" inputMode="url" placeholder="…ou colle un lien (https://…)" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} : lien`} />
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  );
}
