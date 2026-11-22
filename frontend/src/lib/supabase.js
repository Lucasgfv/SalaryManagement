// Supabase client. If the env vars are missing the app keeps working in local-only mode.
import { createClient } from "@supabase/supabase-js";

const env = import.meta.env;
// VITE_* for local .env.local; NEXT_PUBLIC_* are created by the Vercel ↔ Supabase integration.
const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const isCloudEnabled = Boolean(supabase);
