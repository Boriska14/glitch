import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;
/** Lecture publique (aucune session) : compatible avec le rendu statique / ISR. */
export function anonClient() {
  return (client ??= createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false, autoRefreshToken: false } }));
}
