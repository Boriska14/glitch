import { spotifyEmbed } from "@/lib/volumes";
import type { Playlist } from "@/lib/types";

export default function SpotifyEmbed({ p }: { p: Playlist }) {
  const src = spotifyEmbed(p.url);
  return (
    <article className="card playlist">
      <h3>{p.title}</h3>
      {p.note && <p className="muted">{p.note}</p>}
      {src ? (
        <iframe
          title={`Playlist Spotify : ${p.title}`}
          src={src}
          width="100%"
          height="352"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ border: 0, borderRadius: 12 }}
        />
      ) : null}
      <a className="btn btn-ghost" href={p.url} target="_blank" rel="noopener noreferrer">Ouvrir dans Spotify ↗</a>
    </article>
  );
}
