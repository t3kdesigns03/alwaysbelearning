import { adminClient } from './supabase';
import { HttpError } from './env';
import { buildResult, findItem, toPublicMission } from '../grading';
import type { AnswerResult, CrewName, MissionPayload, Profile } from '../types';

export type MissionRow = {
  id: string;
  learner_id: string;
  flown_by: string;
  subject_label: string;
  topic: string;
  unit: string | null;
  lesson: string | null;
  grade: number;
  difficulty: number;
  payload: MissionPayload;
  score: number | null;
  bonus_correct: boolean | null;
  completed_at: string | null;
  created_at: string;
};

export type AnswerRow = {
  question_id: string;
  raw_answer: string | null;
  choice_index: number | null;
  is_correct: boolean;
  feedback: string | null;
};

export async function loadMission(caller: Profile, id: string, mode: 'read' | 'write') {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Unknown mission.');
  const db = adminClient();
  const { data, error } = await db.from('missions').select('*').eq('id', id).maybeSingle();
  if (error) throw new HttpError(500, 'Could not load that mission.');
  if (!data) throw new HttpError(404, 'That mission is not in the log.');
  const m = data as MissionRow;
  const canRead = caller.role === 'parent' || m.learner_id === caller.id;
  if (!canRead) throw new HttpError(403, 'That mission belongs to someone else.');
  if (mode === 'write' && m.flown_by !== caller.id) throw new HttpError(403, 'Only the pilot who launched this mission can answer it.');
  return m;
}

export async function loadAnswers(missionId: string): Promise<AnswerRow[]> {
  const { data, error } = await adminClient()
    .from('answers')
    .select('question_id, raw_answer, choice_index, is_correct, feedback')
    .eq('mission_id', missionId);
  if (error) throw new HttpError(500, 'Could not load answers.');
  return (data ?? []) as AnswerRow[];
}

export function resultsFrom(m: MissionRow, rows: AnswerRow[]): Record<string, AnswerResult> {
  const out: Record<string, AnswerResult> = {};
  for (const r of rows) {
    const found = findItem(m.payload, r.question_id);
    if (!found) continue;
    out[r.question_id] = buildResult(found, r.is_correct, {
      choiceIndex: r.choice_index ?? undefined,
      rawAnswer: r.raw_answer ?? undefined,
      feedback: r.feedback ?? undefined,
    });
  }
  return out;
}

export async function learnerName(id: string): Promise<CrewName> {
  const { data } = await adminClient().from('profiles').select('display_name').eq('id', id).single();
  return (data?.display_name ?? 'JO') as CrewName;
}

export async function publicMission(m: MissionRow) {
  const [rows, name] = await Promise.all([loadAnswers(m.id), learnerName(m.learner_id)]);
  return toPublicMission(m.id, m.payload, {
    learnerName: name,
    coach: m.flown_by !== m.learner_id,
    answers: resultsFrom(m, rows),
    completedAt: m.completed_at,
  });
}

/** First answer counts. A repeat submit returns what was already recorded. */
export async function recordAnswer(
  m: MissionRow,
  questionId: string,
  data: { raw_answer?: string | null; choice_index?: number | null; is_correct: boolean; feedback?: string | null },
): Promise<AnswerRow> {
  if (m.completed_at) throw new HttpError(409, 'This mission is already debriefed.');
  const db = adminClient();
  const row = { mission_id: m.id, question_id: questionId, ...data };
  const { data: inserted, error } = await db
    .from('answers')
    .insert(row)
    .select('question_id, raw_answer, choice_index, is_correct, feedback')
    .single();
  if (!error && inserted) return inserted as AnswerRow;
  if (error?.code === '23505') {
    const { data: existing } = await db
      .from('answers')
      .select('question_id, raw_answer, choice_index, is_correct, feedback')
      .eq('mission_id', m.id)
      .eq('question_id', questionId)
      .single();
    if (existing) return existing as AnswerRow;
  }
  throw new HttpError(500, 'Could not save that answer.');
}
