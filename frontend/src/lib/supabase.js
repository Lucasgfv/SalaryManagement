// Supabase client. If the env vars are missing the app keeps working in local-only mode.
import { createClient } from "@supabase/supabase-js";

// Accepts the names Supabase suggests (PUBLISHABLE_KEY, newer; ANON_KEY, older) and the
// NEXT_PUBLIC_* ones created by the Vercel ↔ Supabase integration. VITE_* is used locally.
const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const isCloudEnabled = Boolean(supabase);
