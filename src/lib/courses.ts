// ─────────────────────────────────────────────────────────────
// Course lists + live curriculum context.
// The DB `courses` table is the source of truth for the dropdown
// (so Dad can add real elective names later). These are the seeds
// and the generator context keyed by label.
// ─────────────────────────────────────────────────────────────
import type { CrewName, Grade } from './types';

export const OTHER = 'Other';

export const DEFAULT_COURSES: Record<'Booty' | 'JO', string[]> = {
  // Iowa Connections Academy · 11th · Pearson Connexus planner names
  Booty: [
    'English 11 A',
    'Algebra 2 A',
    'Environmental Science A',
    'High School Health',
    'Marketing Foundations 1 A',
    'Personal Finance',
  ],
  // Interstate 35 CSD · I-35 Secondary · 7th grade
  JO: [
    'Language Arts 7',
    'Math 7',
    'Science 7',
    'Social Studies 7',
    'Health',
    'Physical Education',
    'Music / Band',
    'Art',
  ],
};

export const GRADE_FOR: Record<'Booty' | 'JO', Grade> = { Booty: 11, JO: 7 };

export const TOPIC_PLACEHOLDER: Record<'Booty' | 'JO', string> = {
  Booty: 'U4, L3: Polynomial Multiplication',
  JO: 'what we covered in class today',
};

export const TOPIC_PROMPT: Record<'Booty' | 'JO', string> = {
  Booty: 'What did Connexus list today?',
  JO: 'What did class cover today?',
};

export type CourseContext = { now: string[]; next: string[]; guardrails?: string };

/** Fall 2026: what is on the planner now, and what is coming next. */
export const COURSE_CONTEXT: Record<string, CourseContext> = {
  // ── Booty · ICA 11 ──
  'English 11 A': {
    now: ['Format and Style', 'Informational Text Conclusions', 'Explanatory Text Portfolio'],
    next: ['synthesis of sources', 'rhetorical situation', 'claim + counterclaim in an explanatory frame'],
    guardrails: 'Use short original passages (60–140 words) you write yourself; never quote copyrighted texts at length.',
  },
  'Algebra 2 A': {
    now: ['Successive Differences', 'Polynomial Multiplication', 'Polynomial Division', 'Polynomial Operations'],
    next: ['polynomial identities', 'factoring special products', 'remainder theorem (stretch)'],
    guardrails: 'Write math in plain text a phone can render: x^2, (2x - 3)(x + 5), 3x^3 - 4x + 1. No LaTeX.',
  },
  'Environmental Science A': {
    now: ['Domestic vs. Wild', 'The Water Cycle'],
    next: ['watersheds', 'human impact on cycles', 'groundwater vs surface water'],
    guardrails: 'Iowa examples welcome (Des Moines River, Raccoon River, tile drainage, the Mississippi). Established science only.',
  },
  'High School Health': {
    now: ['What is Health', 'Identifying Health Risks', 'Taking Responsibility', 'Healthy Decisions unit test'],
    next: ['advocacy and influence', 'sleep and stress as performance'],
    guardrails: 'Age-appropriate and factual. No diagnosis, no medical advice, no scare tactics.',
  },
  'Marketing Foundations 1 A': {
    now: ['wrapping Unit 7', 'Products vs. Services'],
    next: ['branding vs product', 'target market vs segment', 'price vs value'],
    guardrails: 'Use invented or generic businesses; no endorsement of real brands.',
  },
  'Personal Finance': {
    now: ['Types of Creditors and Credits'],
    next: ['interest (simple vs compound)', 'credit score levers', 'installment vs revolving credit'],
    guardrails: 'Factual and neutral. Round, realistic numbers. No product recommendations.',
  },

  // ── JO · I-35 · Grade 7 (Iowa Academic Standards, 2026–27) ──
  'Language Arts 7': {
    now: [
      'citing several pieces of textual evidence',
      'theme vs central idea',
      'narrator vs author point of view',
      'argument vs explanatory writing',
      'precise verbs',
      'sentence combining',
    ],
    next: ['evaluating whether evidence is sufficient', 'how structure shapes meaning', 'counterclaims (grade 8 thread)'],
    guardrails:
      'Write your own short mentor text (a current-events style informational paragraph, a contemporary YA-style excerpt, or a short poem). No dusty set pieces, no copyrighted excerpts.',
  },
  'Math 7': {
    now: [
      'scale drawings',
      'unit rates with fractions/decimals',
      'proportional relationships on a graph',
      'adding and subtracting rational numbers on a number line',
      'real-world integer situations',
      'two-step equations with negatives',
    ],
    next: ['multiplying/dividing rational numbers', 'percent change', 'slope as rate (grade 8 thread)'],
    guardrails: 'Plain-text math: 3/4, -2.5, 2x - 7 = -15. No LaTeX.',
  },
  'Science 7': {
    now: [
      "colliding objects / Newton's third law",
      'kinetic energy transfers',
      'Earth-Sun-Moon system: phases, eclipses, seasons',
      'gravity in the solar system',
      'animal behavior and plant structures for reproductive success',
    ],
    next: ['momentum as an idea', 'orbital models', 'energy conservation (grade 8 thread)'],
    guardrails: 'Iowa Science Standards 2025, Grade 7. Use models, data tables and claim-evidence-reasoning.',
  },
  'Social Studies 7': {
    now: [
      'writing inquiry questions',
      'globalization and international organizations',
      'maps and physical regions of North America and Europe',
      'how Iowa connects to a global issue (ag exports, river systems, manufacturing)',
    ],
    next: ['supply chains', 'comparing sources', 'cause and consequence across regions'],
    guardrails: 'No politics-as-gotcha. Neutral, factual, map- and source-based.',
  },
  Health: {
    now: ['decision-making', 'risk vs hazard', 'sleep and movement'],
    next: ['influences on choices', 'stress and recovery'],
    guardrails: 'Age-appropriate for 12. No scare tactics, no diagnosis.',
  },
  'Physical Education': {
    now: ['sportsmanship', 'warm-up and recovery', 'heart rate zones', 'teamwork and strategy'],
    next: ['training principles (overload, specificity)', 'measuring progress'],
    guardrails: 'Age-appropriate. No weight or body-image talk.',
  },
  'Music / Band': {
    now: ['rhythm vs beat', 'major vs minor color', 'dynamics and tempo'],
    next: ['time signatures', 'how arrangers build texture'],
  },
  Art: {
    now: ['composition choices', 'one- and two-point perspective', 'value and contrast'],
    next: ['color relationships', 'visual hierarchy'],
  },
};

export function contextFor(label: string): CourseContext | null {
  return COURSE_CONTEXT[label] ?? null;
}

// ── Topic parsing ────────────────────────────────────────────
export type ParsedTopic = { unit?: string; lesson?: string; title: string; raw: string };

/**
 * Accepts Connexus planner lines like `U4, L3: Polynomial Multiplication`,
 * `U2,L1 - Domestic vs. Wild`, `Unit 4 Lesson 11: Informational Text Conclusions`.
 * Plain titles pass through untouched.
 */
export function parseTopic(input: string): ParsedTopic {
  const raw = input.trim().replace(/\s+/g, ' ');
  const m = raw.match(
    /^(?:u(?:nit)?\s*(\d{1,2}))\s*[,/·\s]\s*(?:l(?:esson)?\s*(\d{1,2}))\s*[:\-–—.]?\s*(.*)$/i,
  );
  if (m) {
    const title = (m[3] || '').trim();
    return { unit: `U${Number(m[1])}`, lesson: `L${Number(m[2])}`, title: title || raw, raw };
  }
  return { title: raw, raw };
}

// ── JO's day (I-35 Secondary · grades 7–8 bell schedule) ─────
export type Period = { label: string; start: string; end: string; scored: boolean };
export const I35_BELLS: Period[] = [
  { label: '1st', start: '08:15', end: '08:59', scored: true },
  { label: '2nd', start: '09:02', end: '09:46', scored: true },
  { label: '3rd', start: '09:49', end: '10:33', scored: true },
  { label: 'Advisory', start: '10:36', end: '10:56', scored: false },
  { label: '4th · WIN / Music', start: '10:59', end: '11:42', scored: false },
  { label: 'Lunch', start: '11:45', end: '12:08', scored: false },
  { label: '5th', start: '12:11', end: '12:59', scored: true },
  { label: '6th', start: '13:02', end: '13:46', scored: true },
  { label: '7th', start: '13:49', end: '14:33', scored: true },
  { label: '8th', start: '14:36', end: '15:20', scored: true },
];

export function chicagoNow(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hh = get('hour') === '24' ? '00' : get('hour');
  return { weekday: get('weekday'), hhmm: `${hh}:${get('minute')}` };
}

/** Flavor only: where JO's day is right now. Never gates a mission. */
export function i35Status(d = new Date()): string {
  const { weekday, hhmm } = chicagoNow(d);
  if (weekday === 'Sat' || weekday === 'Sun') return 'Weekend orbit · no bells';
  if (hhmm < I35_BELLS[0].start) return `First bell 8:15`;
  if (hhmm > I35_BELLS[I35_BELLS.length - 1].end) return 'Bells done · evening orbit';
  for (let i = 0; i < I35_BELLS.length; i++) {
    const p = I35_BELLS[i];
    if (hhmm >= p.start && hhmm <= p.end) return `Now · ${p.label} ${fmt(p.start)}–${fmt(p.end)}`;
    const n = I35_BELLS[i + 1];
    if (n && hhmm > p.end && hhmm < n.start) return `Passing · ${n.label} at ${fmt(n.start)}`;
  }
  return '';
}

function fmt(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
}

export function isLearner(name: CrewName): name is 'Booty' | 'JO' {
  return name === 'Booty' || name === 'JO';
}
