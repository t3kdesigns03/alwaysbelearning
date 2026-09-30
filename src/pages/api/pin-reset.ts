import { adminClient, requireUser } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';

export const prerender = false;

/**
 * Parent bay → "Clear PIN" for a forgotten PIN. Dad never sees or sets her PIN;
 * this just returns her to the first-open "Set your 6-digit PIN" screen.
 */
export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  if (caller.role !== 'parent') throw new HttpError(403, 'Parent only.');
  const { name } = await readJson<{ name?: string }>(req);
  if (name !== 'Booty' && name !== 'JO') throw new HttpError(400, 'Pick Booty or JO.');
  const { error } = await adminClient()
    .from('profiles')
    .update({ pin_set: false, pin_hash: null, pin_fail_count: 0, pin_failed_at: null })
    .eq('display_name', name)
    .eq('role', 'learner');
  if (error) throw new HttpError(500, 'Could not clear the PIN.');
  return json({ ok: true });
});
