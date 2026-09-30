import { adminClient } from '../../lib/server/supabase';
import { handle, json, HttpError } from '../../lib/server/env';

export const prerender = false;

const ORDER = ['Booty', 'JO', 'Dad'];

/** Public crew roster for the Dock: names, roles, whether a PIN exists. Nothing else. */
export const GET = handle(async () => {
  const { data, error } = await adminClient().from('profiles').select('display_name, role, grade, pin_set');
  if (error) throw new HttpError(500, 'Could not reach the crew roster.');
  const crew = (data ?? [])
    .map((r) => ({ name: r.display_name, role: r.role, grade: r.grade, pinSet: r.pin_set }))
    .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
  return json({ crew });
});
