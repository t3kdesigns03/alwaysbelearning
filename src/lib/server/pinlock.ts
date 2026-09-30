import { adminClient, profileByName } from './supabase';
import { verifyPin } from './pinhash';
import { COOLDOWN_MS, MAX_ATTEMPTS } from '../pin';

type P = NonNullable<Awaited<ReturnType<typeof profileByName>>>;

/** 5 misses → 30 s cool-off, enforced here (not just in the UI). */
export async function checkPin(p: P, pin: string) {
  const db = adminClient();
  const now = Date.now();
  const lastFail = p.pin_failed_at ? new Date(p.pin_failed_at).getTime() : 0;
  let count = p.pin_fail_count ?? 0;

  if (count >= MAX_ATTEMPTS) {
    const retryAt = lastFail + COOLDOWN_MS;
    if (now < retryAt) return { ok: false as const, reason: 'cooldown' as const, retryAt };
    count = 0; // cool-off served
  }

  if (await verifyPin(pin, p.pin_hash)) {
    if (p.pin_fail_count) await db.from('profiles').update({ pin_fail_count: 0, pin_failed_at: null }).eq('id', p.id);
    return { ok: true as const };
  }

  count += 1;
  await db.from('profiles').update({ pin_fail_count: count, pin_failed_at: new Date(now).toISOString() }).eq('id', p.id);
  if (count >= MAX_ATTEMPTS) return { ok: false as const, reason: 'cooldown' as const, retryAt: now + COOLDOWN_MS };
  return { ok: false as const, reason: 'wrong' as const, remaining: MAX_ATTEMPTS - count };
}
