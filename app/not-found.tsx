import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page narrow">
        <p className="kicker">Erreur 404</p>
        <h1 className="page-title">Cette page n'existe pas.</h1>
        <p className="lede">Ou plus. Le reste du magazine, lui, est toujours là.</p>
        <Link className="btn" href="/">Retour à l'accueil</Link>
      </main>
    </>
  );
}
