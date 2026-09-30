import { requireUser } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { loadMission, recordAnswer } from '../../lib/server/missions';
import { gradeShortAnswer } from '../../lib/server/grader';
import { acceptableFor, buildResult, findItem } from '../../lib/grading';

export const prerender = false;

/** Short answers + Deep Orbit free text, graded semantically on the server. */
export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  const { missionId, questionId, answer } = await readJson<{ missionId?: string; questionId?: string; answer?: string }>(req);
  const m = await loadMission(caller, String(missionId ?? ''), 'write');
  const found = findItem(m.payload, String(questionId ?? ''));
  if (!found) throw new HttpError(400, 'Unknown item.');
  // Short questions, or the bonus (which she may always answer in her own words).
  if (found.kind === 'question' && found.item.type !== 'short') throw new HttpError(400, 'That item is multiple choice.');
  const text = String(answer ?? '').trim().slice(0, 1200);
  if (!text) throw new HttpError(400, 'Write it in your own words first.');

  const graded = await gradeShortAnswer({
    grade: m.grade,
    subject: m.subject_label,
    prompt: found.item.prompt,
    acceptable: acceptableFor(found.item),
    why: found.item.why,
    answer: text,
  });
  const saved = await recordAnswer(m, found.item.id, {
    raw_answer: text,
    is_correct: graded.correct,
    feedback: graded.feedback,
  });
  return json({
    result: buildResult(found, saved.is_correct, { rawAnswer: saved.raw_answer ?? undefined, feedback: saved.feedback ?? undefined }),
  });
});
