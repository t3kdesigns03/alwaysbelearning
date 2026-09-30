// ─────────────────────────────────────────────────────────────
// LOCAL DEMO MODE — runs when PUBLIC_SUPABASE_URL is not set.
// Everything lives in this browser's localStorage so `npm run dev`
// is flyable on day one. Missions come from hand-written samples.
// Live mode never touches this file's storage.
// ─────────────────────────────────────────────────────────────
import type { Backend, LearnerName } from './api';
import { ApiError } from './errors';
import type { AnswerResult, Course, CrewName, Debrief, MissionPayload, Profile, SubjectStat } from './types';
import { DEFAULT_COURSES, GRADE_FOR, parseTopic } from './courses';
import { COOLDOWN_MS, MAX_ATTEMPTS, pinProblem } from './pin';
import { pickSample } from './samples';
import { acceptableFor, buildResult, findItem, heuristicGrade, toPublicMission } from './grading';
import { chicagoDay, DEFAULT_DIFFICULTY, missionPoints, nextDifficulty, nextStreak, rankFor, clampDifficulty } from './scoring';

const KEY = 'abl-demo-v1';

type DemoMission = {
  id: string;
  learner: LearnerName;
  flownBy: CrewName;
  payload: MissionPayload;
  answers: Record<string, AnswerResult>;
  createdAt: string;
  completedAt: string | null;
  score: number | null;
  bonusCorrect: boolean | null;
  difficultyAfter?: number;
  demoNote?: string;
};

type State = {
  session: CrewName | null;
  pins: Partial<Record<LearnerName, { hash: string; fails: number; failedAt: number }>>;
  courses: Record<LearnerName, Course[]>;
  stats: Record<LearnerName, Record<string, SubjectStat>>;
  missions: DemoMission[];
};

function fresh(): State {
  const mk = (n: LearnerName): Course[] => DEFAULT_COURSES[n].map((label, i) => ({ id: `${n}-${i}`, label, sortOrder: i + 1 }));
  return { session: null, pins: {}, courses: { Booty: mk('Booty'), JO: mk('JO') }, stats: { Booty: {}, JO: {} }, missions: [] };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...(JSON.parse(raw) as State) };
  } catch {
    /* private mode, blocked storage — fall through */
  }
  return fresh();
}

function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const PROFILE_IDS: Record<CrewName, string> = { Booty: 'demo-booty', JO: 'demo-jo', Dad: 'demo-dad' };

function profile(name: CrewName, s: State): Profile {
  return {
    id: PROFILE_IDS[name],
    displayName: name,
    role: name === 'Dad' ? 'parent' : 'learner',
    grade: name === 'Dad' ? null : GRADE_FOR[name],
    pinSet: name === 'Dad' ? false : Boolean(s.pins[name]),
  };
}

async function pinHash(pin: string, salt?: string): Promise<string> {
  const saltBytes = salt ? Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120_000 }, key, 256);
  const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
  return `pbkdf2$${b64(saltBytes)}$${b64(new Uint8Array(bits))}`;
}

async function pinMatches(pin: string, stored: string) {
  const [, salt] = stored.split('$');
  return (await pinHash(pin, salt)) === stored;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function requireSession(s: State): CrewName {
  if (!s.session) throw new ApiError('Sign in first.', 401);
  return s.session;
}

function canSee(me: CrewName, learner: LearnerName) {
  if (me !== 'Dad' && me !== learner) throw new ApiError('That board belongs to someone else.', 403);
}

function uuid() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function getMission(s: State, id: string) {
  const m = s.missions.find((x) => x.id === id);
  if (!m) throw new ApiError('That mission is not in the log.', 404);
  return m;
}

export const demoBackend: Backend = {
  mode: 'demo',

  async crew() {
    const s = load();
    return (['Booty', 'JO', 'Dad'] as CrewName[]).map((n) => {
      const p = profile(n, s);
      return { name: n, role: p.role, pinSet: p.pinSet, grade: p.grade };
    });
  },

  async me() {
    const s = load();
    return s.session ? profile(s.session, s) : null;
  },

  async setPin(name, pin, confirm) {
    const s = load();
    if (pin !== confirm) throw new ApiError('Those two PINs don’t match.', 400);
    const problem = pinProblem(pin, name);
    if (problem) throw new ApiError(problem, 400);
    if (s.pins[name]) throw new ApiError('A PIN already exists. Use the keypad.', 409, { reason: 'already_set' });
    s.pins[name] = { hash: await pinHash(pin), fails: 0, failedAt: 0 };
    s.session = name;
    save(s);
  },

  async pinLogin(name, pin) {
    const s = load();
    const rec = s.pins[name];
    if (!rec) return { ok: false, reason: 'not_set' };
    const now = Date.now();
    if (rec.fails >= MAX_ATTEMPTS) {
      if (now < rec.failedAt + COOLDOWN_MS) return { ok: false, reason: 'cooldown', retryAt: rec.failedAt + COOLDOWN_MS };
      rec.fails = 0;
    }
    await wait(250);
    if (await pinMatches(pin, rec.hash)) {
      rec.fails = 0;
      s.session = name;
      save(s);
      return { ok: true };
    }
    rec.fails += 1;
    rec.failedAt = now;
    save(s);
    if (rec.fails >= MAX_ATTEMPTS) return { ok: false, reason: 'cooldown', retryAt: now + COOLDOWN_MS };
    return { ok: false, reason: 'wrong', remaining: MAX_ATTEMPTS - rec.fails };
  },

  async parentLogin(email, password) {
    await wait(300);
    if (!email.includes('@') || password.length < 1) throw new ApiError('Email and password, please.', 400);
    const s = load();
    s.session = 'Dad';
    save(s);
  },

  async changePin(current, next, confirm) {
    const s = load();
    const me = requireSession(s);
    if (me === 'Dad') throw new ApiError('Only crew with a PIN can change one.', 403);
    const rec = s.pins[me];
    if (!rec || !(await pinMatches(current, rec.hash))) throw new ApiError('Current PIN didn’t match.', 400);
    if (next !== confirm) throw new ApiError('The new PINs don’t match.', 400);
    const problem = pinProblem(next, me);
    if (problem) throw new ApiError(problem, 400);
    if (next === current) throw new ApiError('Pick a PIN you haven’t used yet.', 400);
    rec.hash = await pinHash(next);
    save(s);
  },

  async resetPin(name) {
    const s = load();
    if (requireSession(s) !== 'Dad') throw new ApiError('Parent only.', 403);
    delete s.pins[name];
    save(s);
  },

  async signOut() {
    const s = load();
    s.session = null;
    save(s);
  },

  async courses(name) {
    const s = load();
    canSee(requireSession(s), name);
    return [...s.courses[name]].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async addCourse(name, label) {
    const s = load();
    if (requireSession(s) !== 'Dad') throw new ApiError('Parent only.', 403);
    const clean = label.trim();
    if (!clean) throw new ApiError('Name the course.', 400);
    if (s.courses[name].some((c) => c.label.toLowerCase() === clean.toLowerCase())) throw new ApiError('That course is already on the list.', 409);
    s.courses[name].push({ id: uuid(), label: clean, sortOrder: Math.max(0, ...s.courses[name].map((c) => c.sortOrder)) + 1 });
    save(s);
  },

  async removeCourse(name, id) {
    const s = load();
    if (requireSession(s) !== 'Dad') throw new ApiError('Parent only.', 403);
    s.courses[name] = s.courses[name].filter((c) => c.id !== id);
    save(s);
  },

  async stats(name) {
    const s = load();
    canSee(requireSession(s), name);
    return Object.values(s.stats[name]);
  },

  async missions(name, limit = 12) {
    const s = load();
    canSee(requireSession(s), name);
    return s.missions
      .filter((m) => m.learner === name)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((m) => ({
        id: m.id,
        subject: m.payload.subject,
        topic: m.payload.topic,
        unit: m.payload.unit ?? null,
        lesson: m.payload.lesson ?? null,
        difficulty: m.payload.difficulty,
        score: m.score,
        bonusCorrect: m.bonusCorrect,
        completedAt: m.completedAt,
        createdAt: m.createdAt,
        coach: m.flownBy !== m.learner,
      }));
  },

  async generate({ learnerName, subject, topic, note: _note }) {
    const s = load();
    const me = requireSession(s);
    canSee(me, learnerName);
    const grade = GRADE_FOR[learnerName];
    const parsed = parseTopic(topic);
    const difficulty = clampDifficulty(s.stats[learnerName][subject]?.difficulty ?? DEFAULT_DIFFICULTY);
    const { sample, exact } = pickSample(subject, parsed.title, grade);
    await wait(2600); // let the transmission animation breathe
    const { key: _k, match: _m, subject: sampleSubject, unit: _u, lesson: _l, ...rest } = sample;
    const payload: MissionPayload = {
      ...structuredClone(rest),
      subject,
      topic: parsed.raw,
      grade,
      difficulty,
      ...(parsed.unit ? { unit: parsed.unit, lesson: parsed.lesson } : {}),
    };
    const id = uuid();
    const demoNote = exact
      ? 'Demo mode · sample transmission. Connect Supabase + Anthropic and every mission is generated fresh from what she typed.'
      : `Demo mode · no sample for “${parsed.title}” yet, so this is the ${sampleSubject} sample. Live mode generates from the exact topic.`;
    s.missions.push({
      id, learner: learnerName, flownBy: me, payload, answers: {}, createdAt: new Date().toISOString(),
      completedAt: null, score: null, bonusCorrect: null, demoNote,
    });
    save(s);
    return {
      id,
      mission: toPublicMission(id, payload, { learnerName, coach: me !== learnerName, answers: {}, completedAt: null, demoNote }),
    };
  },

  async mission(id) {
    const s = load();
    const me = requireSession(s);
    const m = getMission(s, id);
    canSee(me, m.learner);
    return toPublicMission(m.id, m.payload, {
      learnerName: m.learner, coach: m.flownBy !== m.learner, answers: m.answers, completedAt: m.completedAt, demoNote: m.demoNote,
    });
  },

  async checkAnswer(missionId, questionId, choiceIndex) {
    const s = load();
    const me = requireSession(s);
    const m = getMission(s, missionId);
    if (m.flownBy !== me) throw new ApiError('Only the pilot can answer.', 403);
    if (m.answers[questionId]) return m.answers[questionId];
    const found = findItem(m.payload, questionId);
    if (!found || found.item.type !== 'mc') throw new ApiError('That item is not multiple choice.', 400);
    await wait(180);
    const result = buildResult(found, choiceIndex === found.item.correctIndex, { choiceIndex });
    m.answers[questionId] = result;
    save(s);
    return result;
  },

  async gradeShort(missionId, questionId, answer) {
    const s = load();
    const me = requireSession(s);
    const m = getMission(s, missionId);
    if (m.flownBy !== me) throw new ApiError('Only the pilot can answer.', 403);
    if (m.answers[questionId]) return m.answers[questionId];
    const found = findItem(m.payload, questionId);
    if (!found) throw new ApiError('Unknown item.', 400);
    const text = answer.trim();
    if (!text) throw new ApiError('Write it in your own words first.', 400);
    await wait(700);
    const g = heuristicGrade(text, acceptableFor(found.item));
    const result = buildResult(found, g.correct, { rawAnswer: text, feedback: g.feedback });
    m.answers[questionId] = result;
    save(s);
    return result;
  },

  async complete(missionId) {
    const s = load();
    const me = requireSession(s);
    const m = getMission(s, missionId);
    canSee(me, m.learner);
    const coach = m.flownBy !== m.learner;
    const stats = s.stats[m.learner];
    const before = m.payload.difficulty;

    if (!m.completedAt) {
      const open = m.payload.questions.filter((q) => !m.answers[q.id]).length + (m.answers[m.payload.bonus.id] ? 0 : 1);
      if (open) throw new ApiError(`${open} item${open === 1 ? '' : 's'} still open.`, 409);
      const score = m.payload.questions.filter((q) => m.answers[q.id]?.correct).length;
      const bonusCorrect = Boolean(m.answers[m.payload.bonus.id]?.correct);
      m.score = score;
      m.bonusCorrect = bonusCorrect;
      m.completedAt = new Date().toISOString();
      if (!coach) {
        const prev = stats[m.payload.subject];
        const today = chicagoDay();
        const next: SubjectStat = {
          subject: m.payload.subject,
          difficulty: nextDifficulty(score, prev?.difficulty ?? before),
          missions: (prev?.missions ?? 0) + 1,
          lastScore: score,
          bestScore: Math.max(prev?.bestScore ?? 0, score),
          streak: nextStreak(prev?.streak ?? 0, prev?.lastFlownOn ?? null, today),
          points: (prev?.points ?? 0) + missionPoints(score, bonusCorrect, before),
          lastFlownOn: today,
          updatedAt: new Date().toISOString(),
        };
        stats[m.payload.subject] = next;
        m.difficultyAfter = next.difficulty;
      } else {
        m.difficultyAfter = before;
      }
      save(s);
    }

    const stat = stats[m.payload.subject] ?? null;
    const debrief: Debrief = {
      missionId: m.id,
      learnerName: m.learner,
      coach,
      subject: m.payload.subject,
      topic: m.payload.topic,
      score: m.score ?? 0,
      bonusCorrect: Boolean(m.bonusCorrect),
      difficultyBefore: before,
      difficultyAfter: m.difficultyAfter ?? before,
      stat,
      rank: rankFor(stat?.points ?? 0),
      missed: m.payload.questions
        .filter((q) => !m.answers[q.id]?.correct)
        .map((q) => ({ prompt: q.prompt, concept: q.concept, why: q.why })),
    };
    return debrief;
  },
};
