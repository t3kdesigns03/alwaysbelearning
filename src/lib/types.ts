// ─────────────────────────────────────────────────────────────
// ABL shared types. Imported by both islands and server routes.
// ─────────────────────────────────────────────────────────────

export type CrewName = 'Booty' | 'JO' | 'Dad';
export type Role = 'parent' | 'learner';
export type Grade = 7 | 11;
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type MissionQuestion = {
  id: string;
  type: 'mc' | 'short';
  prompt: string;
  choices?: string[];
  correctIndex?: number;
  acceptable?: string[];
  concept: string;
  why: string;
  stretch?: string;
};

export type SignalShort = {
  id: string;
  afterQuestion: 2 | 4 | 6;
  text: string;
  tag: string; // e.g. "Did you know · Europa"
  related: boolean; // true if tied to today's topic
};

export type MissionBonus = {
  id: string;
  type: 'mc' | 'short';
  prompt: string;
  fact: string;
  choices?: string[];
  correctIndex?: number;
  acceptable?: string[];
  why: string;
  topicLabel: string;
};

export type MissionPayload = {
  subject: string;
  topic: string;
  grade: Grade;
  difficulty: Difficulty;
  unit?: string;
  lesson?: string;
  questions: MissionQuestion[];
  shorts: SignalShort[]; // exactly 3
  bonus: MissionBonus;
};

/** What the browser is allowed to see before answering: no keys, no whys. */
export type PublicQuestion = Pick<MissionQuestion, 'id' | 'type' | 'prompt' | 'choices'>;
export type PublicBonus = Pick<MissionBonus, 'id' | 'type' | 'prompt' | 'choices' | 'topicLabel'>;
export type PublicMission = {
  id: string;
  learnerName: CrewName;
  coach: boolean;
  subject: string;
  topic: string;
  grade: Grade;
  difficulty: Difficulty;
  unit?: string;
  lesson?: string;
  questions: PublicQuestion[];
  shorts: SignalShort[];
  bonus: PublicBonus;
  answers: Record<string, AnswerResult>;
  completedAt: string | null;
  demoNote?: string;
};

export type AnswerResult = {
  questionId: string;
  correct: boolean;
  /** Short, warm feedback on what she wrote (short answers). */
  feedback?: string;
  concept: string;
  why: string;
  stretch?: string;
  correctIndex?: number;
  choiceIndex?: number;
  rawAnswer?: string;
  /** Bonus only: the fact behind the question. */
  fact?: string;
  /** For short answers, the model answer to compare against. */
  modelAnswer?: string;
};

export type Profile = {
  id: string;
  displayName: CrewName;
  role: Role;
  grade: Grade | null;
  pinSet: boolean;
};

export type CrewStatus = { name: CrewName; role: Role; pinSet: boolean; grade: Grade | null };

export type SubjectStat = {
  subject: string;
  difficulty: Difficulty;
  missions: number;
  lastScore: number | null;
  bestScore: number | null;
  streak: number;
  points: number;
  lastFlownOn: string | null;
  updatedAt: string | null;
};

export type MissionSummary = {
  id: string;
  subject: string;
  topic: string;
  unit?: string | null;
  lesson?: string | null;
  difficulty: number;
  score: number | null;
  bonusCorrect: boolean | null;
  completedAt: string | null;
  createdAt: string;
  coach: boolean;
};

export type Debrief = {
  missionId: string;
  learnerName: CrewName;
  coach: boolean;
  subject: string;
  topic: string;
  score: number;
  bonusCorrect: boolean;
  difficultyBefore: number;
  difficultyAfter: number;
  stat: SubjectStat | null;
  rank: RankName;
  missed: Array<{ prompt: string; concept: string; why: string }>;
};

export type RankName = 'Cadet' | 'Pilot' | 'Navigator' | 'Commander';

export type Course = { id: string; label: string; sortOrder: number };

export type PinLoginResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; remaining: number }
  | { ok: false; reason: 'cooldown'; retryAt: number }
  | { ok: false; reason: 'not_set' }
  | { ok: false; reason: 'error'; message: string };
