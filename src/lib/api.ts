// ─────────────────────────────────────────────────────────────
// Client data layer. One interface, two backends:
//   live — Supabase (RLS reads) + /api/* server functions
//   demo — everything in this browser (no env configured)
// ─────────────────────────────────────────────────────────────
import { DEMO, supabase } from './supabase';
import { demoBackend } from './demo';
import { ApiError } from './errors';
import type {
  AnswerResult, Course, CrewName, CrewStatus, Debrief, MissionSummary,
  PinLoginResult, Profile, PublicMission, SubjectStat,
} from './types';
import { clampDifficulty } from './scoring';

export type LearnerName = 'Booty' | 'JO';

export interface Backend {
  mode: 'live' | 'demo';
  crew(): Promise<CrewStatus[]>;
  me(): Promise<Profile | null>;
  setPin(name: LearnerName, pin: string, confirm: string): Promise<void>;
  pinLogin(name: LearnerName, pin: string): Promise<PinLoginResult>;
  parentLogin(email: string, password: string): Promise<void>;
  changePin(current: string, next: string, confirm: string): Promise<void>;
  resetPin(name: LearnerName): Promise<void>;
  signOut(): Promise<void>;
  courses(name: LearnerName): Promise<Course[]>;
  addCourse(name: LearnerName, label: string): Promise<void>;
  removeCourse(name: LearnerName, id: string): Promise<void>;
  stats(name: LearnerName): Promise<SubjectStat[]>;
  missions(name: LearnerName, limit?: number): Promise<MissionSummary[]>;
  generate(input: { learnerName: LearnerName; subject: string; topic: string; note?: string }): Promise<{ id: string; mission: PublicMission }>;
  mission(id: string): Promise<PublicMission>;
  checkAnswer(missionId: string, questionId: string, choiceIndex: number): Promise<AnswerResult>;
  gradeShort(missionId: string, questionId: string, answer: string): Promise<AnswerResult>;
  complete(missionId: string): Promise<Debrief>;
}

export { ApiError };

// ── live ─────────────────────────────────────────────────────
async function call<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.auth !== false) {
    const { data } = await supabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError('Sign in first.', 401);
    headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('No signal. Check the connection and try again.');
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(String(data.error ?? 'Signal lost. Try again.'), res.status, data);
  return data as T;
}

const idCache = new Map<string, string>();
async function learnerId(name: LearnerName): Promise<string> {
  const hit = idCache.get(name);
  if (hit) return hit;
  const { data, error } = await supabase().from('profiles').select('id').eq('display_name', name).maybeSingle();
  if (error || !data) throw new ApiError(`${name}'s board isn't visible from this login.`, 403);
  idCache.set(name, data.id);
  return data.id;
}

const liveBackend: Backend = {
  mode: 'live',

  async crew() {
    const { crew } = await call<{ crew: CrewStatus[] }>('/api/crew', { auth: false });
    return crew;
  },

  async me() {
    const { data } = await supabase().auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return null;
    const { data: row } = await supabase()
      .from('profiles')
      .select('id, display_name, role, grade, pin_set')
      .eq('id', uid)
      .maybeSingle();
    if (!row) return null;
    return { id: row.id, displayName: row.display_name, role: row.role, grade: row.grade, pinSet: row.pin_set };
  },

  async setPin(name, pin, confirm) {
    const { session } = await call<{ session: { access_token: string; refresh_token: string } }>('/api/pin-set', {
      auth: false,
      body: { name, pin, confirm },
    });
    await supabase().auth.setSession(session);
  },

  async pinLogin(name, pin) {
    const out = await call<PinLoginResult & { session?: { access_token: string; refresh_token: string } }>('/api/pin-login', {
      auth: false,
      body: { name, pin },
    });
    if (out.ok && out.session) {
      const { error } = await supabase().auth.setSession(out.session);
      if (error) return { ok: false, reason: 'error', message: 'Could not open the session.' };
      return { ok: true };
    }
    return out;
  },

  async parentLogin(email, password) {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new ApiError('That email and password didn’t match.', 401);
    const { data: row } = await supabase().from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (row?.role !== 'parent') {
      await supabase().auth.signOut();
      throw new ApiError('This login isn’t attached to Dad’s profile. See README → Seed.', 403);
    }
  },

  async changePin(current, next, confirm) {
    try {
      await call('/api/pin-change', { body: { current, next, confirm } });
    } catch (e) {
      const err = e as ApiError;
      if (err.data?.reason === 'wrong') throw new ApiError(`Current PIN didn’t match. ${err.data.remaining} left before a 30s cool-off.`, 400);
      if (err.data?.reason === 'cooldown') throw new ApiError('Too many misses. Wait 30 seconds.', 429);
      throw err;
    }
  },

  async resetPin(name) {
    await call('/api/pin-reset', { body: { name } });
  },

  async signOut() {
    idCache.clear();
    await supabase().auth.signOut();
  },

  async courses(name) {
    const id = await learnerId(name);
    const { data, error } = await supabase()
      .from('courses')
      .select('id, label, sort_order')
      .eq('learner_id', id)
      .order('sort_order', { ascending: true });
    if (error) throw new ApiError('Could not load courses.');
    return (data ?? []).map((c) => ({ id: c.id, label: c.label, sortOrder: c.sort_order }));
  },

  async addCourse(name, label) {
    const id = await learnerId(name);
    const existing = await this.courses(name);
    const sort = Math.max(0, ...existing.map((c) => c.sortOrder)) + 1;
    const { error } = await supabase().from('courses').insert({ learner_id: id, label: label.trim(), sort_order: sort });
    if (error) throw new ApiError(error.code === '23505' ? 'That course is already on the list.' : 'Could not add that course.');
  },

  async removeCourse(_name, id) {
    const { error } = await supabase().from('courses').delete().eq('id', id);
    if (error) throw new ApiError('Could not remove that course.');
  },

  async stats(name) {
    const id = await learnerId(name);
    const { data, error } = await supabase()
      .from('learner_subject_stats')
      .select('subject_label, difficulty, missions, last_score, best_score, streak, points, last_flown_on, updated_at')
      .eq('learner_id', id);
    if (error) throw new ApiError('Could not load the board.');
    return (data ?? []).map((r) => ({
      subject: r.subject_label,
      difficulty: clampDifficulty(r.difficulty),
      missions: r.missions,
      lastScore: r.last_score,
      bestScore: r.best_score,
      streak: r.streak,
      points: r.points,
      lastFlownOn: r.last_flown_on,
      updatedAt: r.updated_at,
    }));
  },

  async missions(name, limit = 12) {
    const id = await learnerId(name);
    const { data, error } = await supabase()
      .from('missions')
      .select('id, learner_id, flown_by, subject_label, topic, unit, lesson, difficulty, score, bonus_correct, completed_at, created_at')
      .eq('learner_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new ApiError('Could not load missions.');
    return (data ?? []).map((m) => ({
      id: m.id,
      subject: m.subject_label,
      topic: m.topic,
      unit: m.unit,
      lesson: m.lesson,
      difficulty: m.difficulty,
      score: m.score,
      bonusCorrect: m.bonus_correct,
      completedAt: m.completed_at,
      createdAt: m.created_at,
      coach: m.flown_by !== m.learner_id,
    }));
  },

  async generate(input) {
    return call('/api/generate-mission', { body: input });
  },

  async mission(id) {
    const { mission } = await call<{ mission: PublicMission }>(`/api/mission?id=${encodeURIComponent(id)}`);
    return mission;
  },

  async checkAnswer(missionId, questionId, choiceIndex) {
    const { result } = await call<{ result: AnswerResult }>('/api/check-answer', { body: { missionId, questionId, choiceIndex } });
    return result;
  },

  async gradeShort(missionId, questionId, answer) {
    const { result } = await call<{ result: AnswerResult }>('/api/grade-short', { body: { missionId, questionId, answer } });
    return result;
  },

  async complete(missionId) {
    const { debrief } = await call<{ debrief: Debrief }>('/api/complete-mission', { body: { missionId } });
    return debrief;
  },
};

export const api: Backend = DEMO ? demoBackend : liveBackend;
export const isDemo = DEMO;

// ── tiny routing helpers shared by islands ───────────────────
export function go(path: string) {
  window.location.href = path;
}

export function qs(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

/** Which learner board is in view: hers, or (for Dad) the one in ?crew=. */
export function boardFor(me: Profile, fallback: LearnerName = 'Booty'): LearnerName {
  if (me.role === 'learner') return me.displayName as LearnerName;
  const q = qs('crew');
  return q === 'Booty' || q === 'JO' ? q : fallback;
}

export function crewQuery(me: Profile, name: LearnerName) {
  return me.role === 'parent' ? `?crew=${name}` : '';
}

export type { CrewName };
