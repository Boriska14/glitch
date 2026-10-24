import { getSite, isPlaceholder } from "@/lib/volumes";

export default async function Footer() {
  const site = await getSite();
  const links = [
    ["Substack", site.substackUrl],
    ["Spotify", site.spotifyProfileUrl],
    ["Pinterest", site.pinterestProfileUrl],
    ["Instagram", site.instagramUrl ?? ""],
  ].filter(([, u]) => u && !isPlaceholder(u));
  return (
    <footer className="site-footer">
      <div className="zigzag" aria-hidden />
      <div className="footer-mark" aria-hidden>GLITCH</div>
      <div className="footer-row">
        <p>© {new Date().getFullYear()} {site.author} · {site.tagline}</p>
        <ul>
          {links.map(([n, u]) => (
            <li key={n}><a href={u} target="_blank" rel="noopener noreferrer">{n} ↗</a></li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
