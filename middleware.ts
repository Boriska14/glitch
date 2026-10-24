import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/session";

// Contrôle léger : y a-t-il un cookie de session ? La vraie vérification est faite côté serveur (requireAdmin).
export function middleware(req: NextRequest) {
  const has = req.cookies.getAll().some((c) => c.name === COOKIE || c.name.startsWith("sb-"));
  if (req.nextUrl.pathname === "/admin/login" || has) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
