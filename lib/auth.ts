import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE } from "./session";
import { usingSupabase } from "./db";
import { serverClient } from "./supabase/server";

/** Pilote local (développement uniquement) : mot de passe unique ADMIN_PASSWORD. Jamais actif en production sans GLITCH_LOCAL_STORE. */
const localAllowed = () => !!process.env.ADMIN_PASSWORD && (process.env.NODE_ENV !== "production" || !!process.env.GLITCH_LOCAL_STORE);
export const localToken = () => crypto.createHash("sha256").update(`${process.env.ADMIN_PASSWORD}:glitch-dev`).digest("hex");
export const localAuthAllowed = localAllowed;

export async function isAdmin(): Promise<boolean> {
  if (usingSupabase) {
    try {
      const sb = await serverClient();
      const { data } = await sb.auth.getUser(); // valide le jeton auprès de Supabase
      if (!data.user) return false;
      const { data: ok } = await sb.rpc("is_admin"); // et vérifie que ce compte figure dans la table admins
      return ok === true;
    } catch {
      return false;
    }
  }
  if (!localAllowed()) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && c.length === localToken().length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(localToken()));
}

/** À appeler au début de CHAQUE page et action admin (le middleware ne fait qu'un contrôle de confort). */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
