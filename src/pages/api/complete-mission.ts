import { adminClient, requireUser } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { loadAnswers, loadMission, learnerName } from '../../lib/server/missions';
import { chicagoDay, clampDifficulty, missionPoints, nextDifficulty, nextStreak, rankFor } from '../../lib/scoring';
import { onEightScale, scoredItems } from '../../lib/grading';
import type { Debrief, SubjectStat } from '../../lib/types';

export const prerender = false;

type StatRow = {
  subject_label: string; difficulty: number; missions: number; last_score: number | null; best_score: number | null;
  streak: number; points: number; last_flown_on: string | null; updated_at: string | null;
};

const toStat = (r: StatRow): SubjectStat => ({
  subject: r.subject_label,
  difficulty: clampDifficulty(r.difficulty),
  missions: r.missions,
  lastScore: r.last_score,
  bestScore: r.best_score,
  streak: r.streak,
  points: r.points,
  lastFlownOn: r.last_flown_on,
  updatedAt: r.updated_at,
});

/** Score from recorded answers (never from the client), then update stats, difficulty, streak. Idempotent. */
export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  const { missionId } = await readJson<{ missionId?: string }>(req);
  const m = await loadMission(caller, String(missionId ?? ''), 'read');
  const db = adminClient();
  const coach = m.flown_by !== m.learner_id;

  const rows = await loadAnswers(m.id);
  const byId = new Map(rows.map((r) => [r.question_id, r]));
  // Only items that pass the subject lock count (older missions may carry off-subject items, skipped at render).
  const counted = scoredItems(m.payload);
  const outOf = counted.questions.length;
  const unanswered = counted.questions.filter((q) => !byId.has(q.id)).length + (counted.bonus && !byId.has(counted.bonus.id) ? 1 : 0);

  const statSel = 'subject_label, difficulty, missions, last_score, best_score, streak, points, last_flown_on, updated_at';
  const loadStat = async () =>
    (await db.from('learner_subject_stats').select(statSel).eq('learner_id', m.learner_id).eq('subject_label', m.subject_label).maybeSingle()).data as StatRow | null;

  let difficultyAfter = m.difficulty;
  let stat: StatRow | null;

  if (!m.completed_at) {
    if (m.flown_by !== caller.id) throw new HttpError(403, 'Only the pilot can close this mission.');
    if (unanswered > 0) throw new HttpError(409, `${unanswered} item${unanswered === 1 ? '' : 's'} still open.`);
    const score = counted.questions.filter((q) => byId.get(q.id)?.is_correct).length;
    const bonusCorrect = Boolean(counted.bonus && byId.get(counted.bonus.id)?.is_correct);
    const eight = onEightScale(score, outOf);

    const { data: closed } = await db
      .from('missions')
      .update({ score, bonus_correct: bonusCorrect, completed_at: new Date().toISOString() })
      .eq('id', m.id)
      .is('completed_at', null)
      .select('id');
    m.score = score;
    m.bonus_correct = bonusCorrect;

    stat = await loadStat();
    // Coach runs (Dad flying her board) are logged but don't move her stats.
    if (closed?.length && !coach) {
      const today = chicagoDay();
      const prevDiff = stat?.difficulty ?? m.difficulty;
      difficultyAfter = nextDifficulty(eight, prevDiff);
      const next = {
        learner_id: m.learner_id,
        subject_label: m.subject_label,
        difficulty: difficultyAfter,
        missions: (stat?.missions ?? 0) + 1,
        last_score: eight,
        best_score: Math.max(stat?.best_score ?? 0, eight),
        streak: nextStreak(stat?.streak ?? 0, stat?.last_flown_on ?? null, today),
        points: (stat?.points ?? 0) + missionPoints(eight, bonusCorrect, m.difficulty),
        last_flown_on: today,
        updated_at: new Date().toISOString(),
      };
      const { error } = await db.from('learner_subject_stats').upsert(next, { onConflict: 'learner_id,subject_label' });
      if (error) throw new HttpError(500, 'Could not update the board.');
      stat = await loadStat();
    }
  } else {
    stat = await loadStat();
    difficultyAfter = coach ? m.difficulty : stat?.difficulty ?? m.difficulty;
  }

  const missed = counted.questions
    .filter((q) => !byId.get(q.id)?.is_correct)
    .map((q) => ({ prompt: q.prompt, concept: q.concept, why: q.why }));

  const debrief: Debrief = {
    missionId: m.id,
    learnerName: await learnerName(m.learner_id),
    coach,
    subject: m.subject_label,
    topic: m.topic,
    score: m.score ?? 0,
    outOf,
    bonusCorrect: Boolean(m.bonus_correct),
    difficultyBefore: m.difficulty,
    difficultyAfter,
    stat: stat ? toStat(stat) : null,
    rank: rankFor(stat?.points ?? 0),
    missed,
  };
  return json({ debrief });
});
