import { requireUser } from '../../lib/server/supabase';
import { handle, json, HttpError } from '../../lib/server/env';
import { loadMission, publicMission } from '../../lib/server/missions';

export const prerender = false;

/** GET /api/mission?id=… → the mission without its answer key, plus anything already answered. */
export const GET = handle(async (req) => {
  const caller = await requireUser(req);
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!id) throw new HttpError(400, 'Missing mission id.');
  const m = await loadMission(caller, id, 'read');
  return json({ mission: await publicMission(m) });
});
