import { requireUser } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { loadMission, recordAnswer } from '../../lib/server/missions';
import { buildResult, findItem } from '../../lib/grading';

export const prerender = false;

/** Multiple choice: graded on the server so the key never ships to the browser. */
export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  const { missionId, questionId, choiceIndex } = await readJson<{ missionId?: string; questionId?: string; choiceIndex?: number }>(req);
  const m = await loadMission(caller, String(missionId ?? ''), 'write');
  const found = findItem(m.payload, String(questionId ?? ''));
  if (!found || found.item.type !== 'mc') throw new HttpError(400, 'That item is not multiple choice.');
  if (typeof choiceIndex !== 'number' || choiceIndex < 0 || choiceIndex > 3) throw new HttpError(400, 'Pick one of the four.');

  const saved = await recordAnswer(m, found.item.id, {
    choice_index: choiceIndex,
    is_correct: choiceIndex === found.item.correctIndex,
  });
  return json({
    result: buildResult(found, saved.is_correct, { choiceIndex: saved.choice_index ?? undefined }),
  });
});
