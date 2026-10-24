import { pad } from "@/lib/volumes";
import { Sun } from "./Motifs";
import type { Volume } from "@/lib/types";

/** Couverture réelle si elle existe, sinon une couverture générée (rouge, arche noire, soleil, pastille « VOL »). */
export default function VolumeCover({ v, priority }: { v: Volume; priority?: boolean }) {
  const alt = `Couverture de GLITCH, volume ${pad(v.number)}`;
  if (v.cover) {
    return (
      <div className="cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.cover} alt={alt} loading={priority ? "eager" : "lazy"} />
      </div>
    );
  }
  return (
    <div className="cover cover-gen" role="img" aria-label={alt}>
      <span className="cg-top">Système · Corps · Machine · Esprit</span>
      <span className="cg-title">GLITCH</span>
      {v.handwritten && <span className="cg-hand">{v.handwritten}</span>}
      <span className="cg-arch"><Sun className="cg-sun" /></span>
      <span className="cg-vol">VOL<br />{pad(v.number)}</span>
    </div>
  );
}
