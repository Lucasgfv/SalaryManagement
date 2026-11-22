import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Only vars with these prefixes reach the browser bundle. NEXT_PUBLIC_ is added because the
  // Vercel ↔ Supabase integration creates NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY automatically.
  // Secrets (SUPABASE_SECRET_KEY, POSTGRES_*, SUPABASE_JWT_SECRET) have no prefix → never exposed.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
