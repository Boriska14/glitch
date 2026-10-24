import { supabaseConfigured } from "@/lib/supabase/config";
import * as sb from "./supabase";
import * as local from "./local";

/** Supabase dès qu'il est configuré ; sinon pilote local (développement / aperçu sans base). */
export const db = supabaseConfigured ? sb : local;
export const usingSupabase = supabaseConfigured;
