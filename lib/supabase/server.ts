import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON, SUPABASE_URL } from "./config";

/** Client authentifié (session de l'admin lue dans les cookies) : les règles RLS s'appliquent avec son identité. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* rendu serveur : lecture seule */ }
      },
    },
  });
}
