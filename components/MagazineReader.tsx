"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void>; cancel: () => void };
};

export const GOTO_EVENT = "glitch:goto-page";

/** Lien de sommaire : ouvre le lecteur à la page voulue. */
export function PageLink({ page, children }: { page: number; children: React.ReactNode }) {
  return (
    <a
      className="toc-jump"
      href="#lecteur"
      title={`Lire la page ${page}`}
      onClick={() => window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: page }))}
    >
      {children}
    </a>
  );
}

/** Lecteur du magazine dans le site (pdf.js) : s'ouvre sur la première page, téléchargement facultatif. */
export default function MagazineReader({ url, title }: { url: string; title: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const doc = useRef<PdfDoc | null>(null);
  const touch = useRef<number | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rendering, setRendering] = useState(true);
  const [full, setFull] = useState(false);
  const [width, setWidth] = useState(0);

  // Chargement du PDF (une seule fois)
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const d = (await pdfjs.getDocument({ url }).promise) as unknown as PdfDoc;
        if (dead) return;
        doc.current = d;
        setTotal(d.numPages);
        setStatus("ready");
      } catch {
        if (!dead) setStatus("error");
      }
    })();
    return () => { dead = true; };
  }, [url]);

  // Largeur disponible
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // Dessin de la page courante
  useEffect(() => {
    if (status !== "ready" || !doc.current || !canvas.current || !width) return;
    let task: { promise: Promise<void>; cancel: () => void } | null = null;
    let dead = false;
    setRendering(true);
    (async () => {
      const p = await doc.current!.getPage(page);
      if (dead) return;
      const base = p.getViewport({ scale: 1 });
      const maxH = full ? window.innerHeight - 120 : Math.max(480, window.innerHeight * 0.82);
      const fit = Math.min(width / base.width, maxH / base.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const vp = p.getViewport({ scale: fit * dpr });
      const c = canvas.current!;
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      c.style.width = `${Math.floor(vp.width / dpr)}px`;
      c.style.height = `${Math.floor(vp.height / dpr)}px`;
      task = p.render({ canvasContext: c.getContext("2d")!, viewport: vp });
      try { await task.promise; if (!dead) setRendering(false); } catch { /* rendu annulé */ }
    })();
    return () => { dead = true; task?.cancel(); };
  }, [status, page, width, full]);

  const go = useCallback((n: number) => setPage((p) => Math.min(Math.max(1, Math.round(n) || p), total || 1)), [total]);

  // Sauts depuis le sommaire
  useEffect(() => {
    const on = (e: Event) => go(Number((e as CustomEvent).detail));
    window.addEventListener(GOTO_EVENT, on);
    return () => window.removeEventListener(GOTO_EVENT, on);
  }, [go]);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.current?.requestFullscreen?.().catch(() => {});
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(page + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(page - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(1); }
    else if (e.key === "End") { e.preventDefault(); go(total); }
  }

  return (
    <div className={`reader ${full ? "is-full" : ""}`} ref={wrap} onKeyDown={onKey} tabIndex={-1}>
      <div className="reader-bar">
        <button type="button" className="rd-btn" onClick={() => go(page - 1)} disabled={page <= 1 || status !== "ready"} aria-label="Page précédente">←</button>
        <label className="rd-pages">
          <span className="sr">Page</span>
          <input type="number" min={1} max={total || 1} value={page} onChange={(e) => go(Number(e.target.value))} disabled={status !== "ready"} aria-label="Numéro de page" />
          <span>/ {total || "–"}</span>
        </label>
        <button type="button" className="rd-btn" onClick={() => go(page + 1)} disabled={page >= total || status !== "ready"} aria-label="Page suivante">→</button>
        <span className="rd-spacer" />
        <button type="button" className="rd-btn wide" onClick={toggleFull} disabled={status !== "ready"}>{full ? "Quitter" : "Plein écran"}</button>
        <a className="rd-btn wide" href={url} download target="_blank" rel="noopener noreferrer">Télécharger le PDF</a>
      </div>

      <div
        className="reader-stage"
        ref={stage}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(page + (dx < 0 ? 1 : -1));
        }}
      >
        {status === "loading" && <p className="reader-msg">Ouverture du magazine…</p>}
        {status === "error" && (
          <p className="reader-msg">
            Le lecteur n'a pas pu s'ouvrir. <a href={url} target="_blank" rel="noopener noreferrer">Ouvrir le PDF dans un nouvel onglet ↗</a>
          </p>
        )}
        <canvas ref={canvas} className={`reader-page ${rendering ? "busy" : ""}`} role="img" aria-label={`${title}, page ${page} sur ${total}`} hidden={status !== "ready"} />
        {status === "ready" && (
          <>
            <button type="button" className="rd-zone left" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Page précédente" tabIndex={-1} />
            <button type="button" className="rd-zone right" onClick={() => go(page + 1)} disabled={page >= total} aria-label="Page suivante" tabIndex={-1} />
          </>
        )}
      </div>
    </div>
  );
}
