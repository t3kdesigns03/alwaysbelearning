import { adminClient, profileByName, requireUser } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { hashPin } from '../../lib/server/pinhash';
import { pinProblem } from '../../lib/pin';
import { checkPin } from '../../lib/server/pinlock';

export const prerender = false;

/** Settings → change PIN: current PIN + new PIN twice. */
export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  if (caller.role !== 'learner') throw new HttpError(403, 'Only crew with a PIN can change one.');
  const { current, next, confirm } = await readJson<{ current?: string; next?: string; confirm?: string }>(req);
  if (typeof current !== 'string' || typeof next !== 'string') throw new HttpError(400, 'Six digits each.');
  if (next !== confirm) throw new HttpError(400, 'The new PINs don’t match.');
  const problem = pinProblem(next, caller.displayName);
  if (problem) throw new HttpError(400, problem);
  if (next === current) throw new HttpError(400, 'Pick a PIN you haven’t used yet.');

  const p = await profileByName(caller.displayName);
  if (!p) throw new HttpError(404, 'Profile missing.');
  const check = await checkPin(p, current);
  if (!check.ok) return json(check, check.reason === 'cooldown' ? 429 : 400);

  const { error } = await adminClient()
    .from('profiles')
    .update({ pin_hash: await hashPin(next), pin_fail_count: 0, pin_failed_at: null })
    .eq('id', p.id);
  if (error) throw new HttpError(500, 'Could not save the new PIN.');
  return json({ ok: true });
});
