import cfg from "@/content/supabase.json";

// L'URL et la clé « anon » de Supabase sont publiques par conception (la sécurité repose sur les règles RLS
// du fichier supabase/schema.sql). On peut donc les garder dans content/supabase.json, sans variable Vercel.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || cfg.url;
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || cfg.anonKey;
export const supabaseConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(SUPABASE_URL) && SUPABASE_ANON.length > 30 && !/VOTRE-/.test(SUPABASE_ANON);
