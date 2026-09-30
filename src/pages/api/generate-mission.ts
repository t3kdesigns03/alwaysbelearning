import { adminClient, requireUser, resolveLearner } from '../../lib/server/supabase';
import { handle, json, readJson, HttpError } from '../../lib/server/env';
import { generateMission } from '../../lib/server/generator';
import { assertConfigured } from '../../lib/server/llm';
import { toPublicMission } from '../../lib/grading';
import { parseTopic } from '../../lib/courses';
import { clampDifficulty, DEFAULT_DIFFICULTY } from '../../lib/scoring';
import type { Grade } from '../../lib/types';

export const prerender = false;

const DAILY_CAP = 15; // per learner per rolling 24 h — protects the Anthropic bill from a stuck button

export const POST = handle(async (req) => {
  const caller = await requireUser(req);
  assertConfigured(); // fail fast (503) if the chosen AI provider has no key
  const body = await readJson<{ subject?: string; topic?: string; note?: string; learnerName?: string; learnerId?: string }>(req);
  const learner = await resolveLearner(caller, body.learnerName);
  if (body.learnerId && body.learnerId !== learner.id) throw new HttpError(400, 'Learner mismatch.');

  const subject = (body.subject ?? '').trim().slice(0, 80);
  const topicRaw = (body.topic ?? '').trim().slice(0, 200);
  const note = (body.note ?? '').trim().slice(0, 300) || undefined;
  if (!subject) throw new HttpError(400, 'Pick a subject.');
  if (topicRaw.length < 2) throw new HttpError(400, 'Type today’s topic — that’s the source of truth.');

  const db = adminClient();
  const grade = learner.grade as Grade;

  // Custom "Other" subjects are allowed; listed courses come from the DB.
  const { data: stat } = await db
    .from('learner_subject_stats')
    .select('difficulty, last_score')
    .eq('learner_id', learner.id)
    .eq('subject_label', subject)
    .maybeSingle();

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await db
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('learner_id', learner.id)
    .gte('created_at', since);
  if ((count ?? 0) >= DAILY_CAP) throw new HttpError(429, `That’s ${DAILY_CAP} transmissions in a day. The system rests until tomorrow.`);

  const { data: recent } = await db
    .from('missions')
    .select('topic')
    .eq('learner_id', learner.id)
    .eq('subject_label', subject)
    .order('created_at', { ascending: false })
    .limit(5);

  // JO has no Connexus codes: only parse unit/lesson when she actually typed them.
  const parsed = parseTopic(topicRaw);
  const difficulty = clampDifficulty(stat?.difficulty ?? DEFAULT_DIFFICULTY);

  const payload = await generateMission({
    learnerName: learner.displayName as 'Booty' | 'JO',
    grade,
    subject,
    topic: parsed,
    note,
    difficulty,
    lastScore: stat?.last_score ?? null,
    recentTopics: (recent ?? []).map((r) => r.topic),
    coach: caller.id !== learner.id,
  });

  const { data: row, error } = await db
    .from('missions')
    .insert({
      learner_id: learner.id,
      flown_by: caller.id,
      subject_label: subject,
      topic: topicRaw,
      note: note ?? null,
      unit: payload.unit ?? null,
      lesson: payload.lesson ?? null,
      grade,
      difficulty,
      payload,
    })
    .select('id')
    .single();
  if (error || !row) throw new HttpError(500, 'Could not log the mission.');

  return json({
    id: row.id,
    mission: toPublicMission(row.id, payload, {
      learnerName: learner.displayName,
      coach: caller.id !== learner.id,
      answers: {},
      completedAt: null,
    }),
  });
});
