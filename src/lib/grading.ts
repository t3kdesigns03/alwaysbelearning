// Shared grading helpers (server + local demo mode).
import type { AnswerResult, MissionPayload, PublicMission, CrewName } from './types';
import { itemFitsSubject } from './subjects';

const STOP = new Set(
  'a an the of to and or is are was were be it its this that in on for with as by at from so because which into than then their her his she he they you your can will would'.split(' '),
);

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[^a-z0-9^+\-*/=().\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const compact = (s: string) => norm(s).replace(/\s+/g, '');
const words = (s: string) => norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));

/** Offline fallback: expression match or key-word overlap with any acceptable answer. */
export function heuristicGrade(answer: string, acceptable: string[]): { correct: boolean; feedback: string } {
  const a = compact(answer);
  const aw = new Set(words(answer));
  let best = 0;
  for (const acc of acceptable) {
    const c = compact(acc);
    if (c && (a === c || (c.length >= 4 && a.includes(c)))) return { correct: true, feedback: 'Signal clear — that is the idea.' };
    const kw = words(acc);
    if (!kw.length) continue;
    const hit = kw.filter((w) => aw.has(w) || [...aw].some((x) => x.length > 4 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))))).length;
    best = Math.max(best, hit / kw.length);
  }
  return best >= 0.5
    ? { correct: true, feedback: 'Signal clear — you named the key idea.' }
    : { correct: false, feedback: 'Almost. Here’s the missing piece.' };
}

/** Strip the answer key before anything reaches the browser. */
export function toPublicMission(
  id: string,
  p: MissionPayload,
  meta: { learnerName: CrewName; coach: boolean; answers: Record<string, AnswerResult>; completedAt: string | null; demoNote?: string },
): PublicMission {
  return {
    id,
    learnerName: meta.learnerName,
    coach: meta.coach,
    subject: p.subject,
    topic: p.topic,
    grade: p.grade,
    difficulty: p.difficulty,
    unit: p.unit,
    lesson: p.lesson,
    questions: p.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, choices: q.choices })),
    shorts: p.shorts,
    bonus: { id: p.bonus.id, type: p.bonus.type, prompt: p.bonus.prompt, choices: p.bonus.choices, topicLabel: p.bonus.topicLabel },
    answers: meta.answers,
    completedAt: meta.completedAt,
    demoNote: meta.demoNote,
  };
}

export function findItem(p: MissionPayload, questionId: string) {
  if (questionId === p.bonus.id) return { kind: 'bonus' as const, item: p.bonus };
  const q = p.questions.find((x) => x.id === questionId);
  return q ? { kind: 'question' as const, item: q } : null;
}

/** Acceptable answers for free text, including the bonus "write instead" path on an mc item. */
export function acceptableFor(item: { type: string; acceptable?: string[]; choices?: string[]; correctIndex?: number }): string[] {
  const list = [...(item.acceptable ?? [])];
  if (item.choices && item.correctIndex !== undefined) list.push(item.choices[item.correctIndex]);
  return list;
}

export function modelAnswerFor(item: { acceptable?: string[]; choices?: string[]; correctIndex?: number }): string | undefined {
  if (item.choices && item.correctIndex !== undefined) return item.choices[item.correctIndex];
  return item.acceptable?.[0];
}

export function buildResult(
  found: NonNullable<ReturnType<typeof findItem>>,
  correct: boolean,
  extra: { choiceIndex?: number; rawAnswer?: string; feedback?: string },
): AnswerResult {
  const item = found.item;
  const concept = found.kind === 'bonus' ? found.item.topicLabel : found.item.concept;
  return {
    questionId: item.id,
    correct,
    feedback: extra.feedback,
    concept,
    why: item.why,
    stretch: found.kind === 'question' ? found.item.stretch : undefined,
    correctIndex: item.correctIndex,
    choiceIndex: extra.choiceIndex,
    rawAnswer: extra.rawAnswer,
    fact: found.kind === 'bonus' ? found.item.fact : undefined,
    modelAnswer: modelAnswerFor(item),
  };
}

/**
 * The items that count: only those that pass the subject lock. A mission built
 * after the lock always has all 8 + 1; older missions may carry off-subject items,
 * which are skipped at render and not scored.
 */
export function scoredItems(p: MissionPayload) {
  return {
    questions: p.questions.filter((q) => itemFitsSubject(q, p.subject)),
    bonus: itemFitsSubject(p.bonus, p.subject) ? p.bonus : null,
  };
}

/** Put a score on the /8 scale that difficulty, points and debrief copy expect. */
export function onEightScale(score: number, outOf: number): number {
  return outOf >= 8 || outOf <= 0 ? score : Math.round((score * 8) / outOf);
}
