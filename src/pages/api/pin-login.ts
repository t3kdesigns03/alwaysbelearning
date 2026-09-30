import { mintSession, profileByName } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { checkPin } from '../../lib/server/pinlock';

export const prerender = false;

export const POST = handle(async (req) => {
  const { name, pin } = await readJson<{ name?: string; pin?: string }>(req);
  if (name !== 'Booty' && name !== 'JO') throw new HttpError(400, 'Pick Booty or JO.');
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) throw new HttpError(400, 'Six digits.');

  const p = await profileByName(name);
  if (!p || p.role !== 'learner') throw new HttpError(404, `${name} is not on the roster yet.`);
  if (!p.pin_set) return json({ ok: false, reason: 'not_set' });

  const outcome = await checkPin(p, pin);
  if (!outcome.ok) return json(outcome);
  return json({ ok: true, session: await mintSession(p.id) });
});
