import Link from "next/link";
import { Sun } from "./Motifs";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="logo" aria-label="GLITCH, accueil"><Sun className="logo-sun" />GLITCH</Link>
      <nav aria-label="Navigation principale">
        <Link href="/volumes">Volumes</Link>
        <Link href="/journal">Journal</Link>
        <Link href="/correspondance">Correspondance</Link>
      </nav>
    </header>
  );
}
