// Browser Supabase client (anon key + RLS). Session persists on this
// device until she taps Sign out.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** No Supabase env → the app runs in local demo mode (everything in this browser). */
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
