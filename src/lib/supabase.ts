// Browser Supabase client (anon key + RLS). Session persists on this
// device until she taps Sign out.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// `.env.local` ships with PASTE_… placeholders; a placeholder counts as missing.
const real = (v: string | undefined) => (v && v.trim() && !/^PASTE_[A-Z0-9_]*$/.test(v.trim()) ? v.trim() : undefined);
const url = real(import.meta.env.PUBLIC_SUPABASE_URL as string | undefined);
const anon = real(import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined);

/** No real Supabase URL + anon key → the app runs in local demo mode (everything in this browser). */
export const DEMO = !url || !anon;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (DEMO) throw new Error('Supabase is not configured (demo mode).');
  if (!client) {
    client = createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'abl-session', detectSessionInUrl: false },
    });
  }
  return client;
}
