import Link from "next/link";
import type { Metadata } from "next";
import VolumeCover from "@/components/VolumeCover";
import { getVolumes, pad, formatDate } from "@/lib/volumes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Tous les volumes" };

export default async function Volumes() {
  const volumes = await getVolumes();
  return (
    <section className="page">
      <header className="sec-head solo">
        <h1 className="page-title">Les volumes</h1>
        <span className="sec-meta">{volumes.length} numéro{volumes.length > 1 ? "s" : ""}</span>
      </header>
      <ul className="volume-grid">
        {volumes.map((v, i) => (
          <li key={v.slug}>
            <Link href={`/volumes/${v.slug}`} className="volume-card">
              <VolumeCover v={v} priority={i < 3} />
              <span className="vc-meta">
                <strong>Volume {pad(v.number)}</strong>
                <span>{v.status === "published" ? formatDate(v.releaseDate) || "Disponible" : "Bientôt"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
