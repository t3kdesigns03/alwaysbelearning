// ─────────────────────────────────────────────────────────────
// Scoring, difficulty, streaks, ranks. Pure functions, shared by
// the server (/api/complete-mission) and local demo mode.
// ─────────────────────────────────────────────────────────────
import type { Difficulty, RankName } from './types';

export const QUESTIONS_PER_MISSION = 8;
export const DEFAULT_DIFFICULTY: Difficulty = 3;

/** ≥7/8 → +1 (cap 5) · 5–6 → hold · ≤4 → −1 (floor 1). */
export function nextDifficulty(score: number, current: number): Difficulty {
  let d = current;
  if (score >= 7) d += 1;
  else if (score <= 4) d -= 1;
  return clampDifficulty(d);
}

export function clampDifficulty(n: number): Difficulty {
  return Math.max(1, Math.min(5, Math.round(n))) as Difficulty;
}

/** Harder missions are worth more. Deep Orbit counts as two items. Max 50 at difficulty 5. */
export function missionPoints(score: number, bonusCorrect: boolean, difficulty: number): number {
  return (score + (bonusCorrect ? 2 : 0)) * difficulty;
}

export const RANKS: Array<{ name: RankName; min: number }> = [
  { name: 'Cadet', min: 0 },
  { name: 'Pilot', min: 60 },
  { name: 'Navigator', min: 200 },
  { name: 'Commander', min: 450 },
];

export function rankFor(points: number): RankName {
  let r: RankName = 'Cadet';
  for (const rank of RANKS) if (points >= rank.min) r = rank.name;
  return r;
}

export function nextRank(points: number): { name: RankName; at: number } | null {
  const n = RANKS.find((r) => r.min > points);
  return n ? { name: n.name, at: n.min } : null;
}

/** Calendar day in America/Chicago as YYYY-MM-DD. */
export function chicagoDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function dayDiff(a: string, b: string): number {
  const toUTC = (s: string) => {
    const [y, m, dd] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, dd);
  };
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/** Consecutive Chicago days with a completed mission in this subject. */
export function nextStreak(prevStreak: number, lastFlownOn: string | null, today = chicagoDay()): number {
  if (!lastFlownOn) return 1;
  const gap = dayDiff(lastFlownOn, today);
  if (gap <= 0) return Math.max(1, prevStreak);
  if (gap === 1) return prevStreak + 1;
  return 1;
}

export function debriefLine(score: number): string {
  if (score === 8) return 'Good. Tomorrow we go further.';
  if (score >= 6) return 'Signal clear. Keep going.';
  return 'Now you have the piece. Fly it again.';
}
