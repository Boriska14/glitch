import type { Metadata } from "next";
import Link from "next/link";
import "./admin.css";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();
  return (
    <div className="adm">
      <header className="adm-bar">
        <Link href="/admin" className="adm-brand">GLITCH <span>admin</span></Link>
        {ok && (
          <nav aria-label="Navigation admin">
            <Link href="/admin">Volumes</Link>
            <Link href="/admin/messages">Messages</Link>
            <Link href="/admin/notes">Notes</Link>
            <Link href="/admin/settings">Réglages</Link>
            <Link href="/" target="_blank">Voir le site ↗</Link>
            <form action={logout}><button type="submit" className="adm-link">Se déconnecter</button></form>
          </nav>
        )}
      </header>
      <div className="adm-main">{children}</div>
    </div>
  );
}
