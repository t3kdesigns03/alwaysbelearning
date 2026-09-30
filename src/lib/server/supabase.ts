import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, requireEnv, HttpError } from './env';
import type { CrewName, Profile } from '../types';

let admin: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — server only. */
export function adminClient(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(supabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Fresh anon client (no persisted session) for minting learner sessions. */
export function anonClient(): SupabaseClient {
  return createClient(supabaseUrl(), requireEnv('PUBLIC_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function supabaseUrl(): string {
  const url = env('PUBLIC_SUPABASE_URL');
  if (!url) throw new HttpError(503, 'Server is missing PUBLIC_SUPABASE_URL. See README → Environment.');
  return url;
}

type ProfileRow = {
  id: string;
  display_name: CrewName;
  role: 'parent' | 'learner';
  grade: 7 | 11 | null;
  pin_set: boolean;
};

export function toProfile(r: ProfileRow): Profile {
  return { id: r.id, displayName: r.display_name, role: r.role, grade: r.grade, pinSet: r.pin_set };
}

/** Verify the bearer token and load the caller's profile. */
export async function requireUser(req: Request): Promise<Profile> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sign in first.');
  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Session expired. Sign in again.');
  const { data: row, error: pErr } = await db
    .from('profiles')
    .select('id, display_name, role, grade, pin_set')
    .eq('id', data.user.id)
    .single();
  if (pErr || !row) throw new HttpError(403, 'No crew profile is attached to this login.');
  return toProfile(row as ProfileRow);
}

export async function profileByName(name: string) {
  const { data, error } = await adminClient()
    .from('profiles')
    .select('id, display_name, role, grade, pin_set, pin_hash, pin_failed_at, pin_fail_count')
    .eq('display_name', name)
    .maybeSingle();
  if (error) throw new HttpError(500, 'Could not reach the crew roster.');
  return data as
    | (ProfileRow & { pin_hash: string | null; pin_failed_at: string | null; pin_fail_count: number })
    | null;
}

/**
 * Learners never type an email. After the server verifies her PIN it mints a
 * normal Supabase session for her auth user via a one-time magic-link token
 * (generated and consumed server-side; no email is sent).
 */
export async function mintSession(userId: string) {
  const db = adminClient();
  const { data: u, error: uErr } = await db.auth.admin.getUserById(userId);
  if (uErr || !u.user?.email) throw new HttpError(500, 'Learner login is missing its internal email. See README.');
  const { data: link, error: lErr } = await db.auth.admin.generateLink({ type: 'magiclink', email: u.user.email });
  const tokenHash = link?.properties?.hashed_token;
  if (lErr || !tokenHash) throw new HttpError(500, 'Could not open a session. Try again.');
  const { data: v, error: vErr } = await anonClient().auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash });
  if (vErr || !v.session) throw new HttpError(500, 'Could not open a session. Try again.');
  return { access_token: v.session.access_token, refresh_token: v.session.refresh_token };
}

/** Parent may act on either learner; a learner only on herself. */
export async function resolveLearner(caller: Profile, learnerName?: string | null) {
  const name = caller.role === 'learner' ? caller.displayName : learnerName;
  if (!name || (name !== 'Booty' && name !== 'JO')) throw new HttpError(400, 'Pick a crew member: Booty or JO.');
  if (caller.role === 'learner' && name !== caller.displayName) throw new HttpError(403, 'That board belongs to someone else.');
  const p = await profileByName(name);
  if (!p || p.role !== 'learner') throw new HttpError(404, `${name} is not on the roster yet. See README → Seed.`);
  return toProfile(p);
}
