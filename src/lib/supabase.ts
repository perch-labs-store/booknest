import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until the Supabase vars in .env.local are filled in (see .env.example). */
export const isSupabaseConfigured = Boolean(url && anonKey);

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null };

/**
 * Supabase client that signs every request with the signed-in user's Clerk session token
 * (Supabase "Third-Party Auth"), so the Row Level Security policies in supabase/schema.sql
 * know who is asking. Signed out, it falls back to the anon key.
 *
 * Books and authors are loaded and saved in src/data/remote.ts.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      accessToken: async () => (window as unknown as { Clerk?: ClerkGlobal }).Clerk?.session?.getToken() ?? null,
    })
  : null;
