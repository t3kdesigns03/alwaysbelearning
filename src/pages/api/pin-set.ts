import { adminClient, mintSession, profileByName } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { hashPin } from '../../lib/server/pinhash';
import { pinProblem } from '../../lib/pin';

export const prerender = false;

/** First open only: she chooses her own 6-digit PIN. */
export const POST = handle(async (req) => {
  const { name, pin, confirm } = await readJson<{ name?: string; pin?: string; confirm?: string }>(req);
  if (name !== 'Booty' && name !== 'JO') throw new HttpError(400, 'Pick Booty or JO.');
  if (typeof pin !== 'string' || pin !== confirm) throw new HttpError(400, 'Those two PINs don’t match.');
  const problem = pinProblem(pin, name);
  if (problem) throw new HttpError(400, problem);

  const p = await profileByName(name);
  if (!p || p.role !== 'learner') throw new HttpError(404, `${name} is not on the roster yet.`);
  if (p.pin_set) throw new HttpError(409, 'A PIN already exists. Use the keypad.', { reason: 'already_set' });

  const pin_hash = await hashPin(pin);
  const { data, error } = await adminClient()
    .from('profiles')
    .update({ pin_hash, pin_set: true, pin_fail_count: 0, pin_failed_at: null })
    .eq('id', p.id)
    .eq('pin_set', false) // no race: only the first setter wins
    .select('id');
  if (error) throw new HttpError(500, 'Could not save your PIN.');
  if (!data?.length) throw new HttpError(409, 'A PIN already exists. Use the keypad.', { reason: 'already_set' });

  return json({ session: await mintSession(p.id) });
});
