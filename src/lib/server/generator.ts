// ─────────────────────────────────────────────────────────────
// Mission generator. Two parallel Claude calls (Q1–Q4 + signal
// shorts, Q5–Q8 + Deep Orbit) keep wall-clock inside a Netlify
// function budget. Every part is schema-validated; MC choices are
// shuffled server-side so the key is never "always B".
// ─────────────────────────────────────────────────────────────
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { callTool, GENERATION_MODEL } from './anthropic';
import { HttpError } from './env';
import { contextFor, type ParsedTopic } from '../courses';
import type { Difficulty, Grade, MissionPayload, MissionQuestion, SignalShort } from '../types';

export type GenerateInput = {
  learnerName: 'Booty' | 'JO';
  grade: Grade;
  subject: string;
  topic: ParsedTopic;
  note?: string;
  difficulty: Difficulty;
  lastScore: number | null;
  recentTopics: string[];
  coach: boolean;
};

const SYSTEM = `You are a rigorous Iowa Connections Academy practice author writing for ABL — "Always Be Learning", a private nightly practice system for two sisters. You also write for the younger sister's brick-and-mortar school (Interstate 35 CSD, Truro, Iowa) using the Iowa Academic Standards for Grade 7.

THE JOB
The learner already did today's lesson. Lock today's idea, then push past it the same night. Comfortable is the failure state. Confused-for-ten-seconds-then-taught is the win.

NON-NEGOTIABLES
- Honor the typed unit/lesson title. It is the source of truth. Write questions that actually test that lesson — never generic "what is algebra" filler.
- Original questions only — no copied test-bank items, no copyrighted passages.
- JSON only, via the provided tool, in the MissionPayload shape.
- Difficulty 1 = scaffolded review. 3 = default push. 5 = honors stretch still on that lesson. Default missions must feel like 3 even on day one.
- Always Be Learning: at least three of the eight items must require transfer, not recognition.
- Wrong MC options are plausible misconceptions — the exact mistakes a real student makes (sign errors, dropped middle terms, confusing theme with topic, thinking the Moon makes its own light). Never joke options. Never "all of the above", "none of the above", "both A and B", or letter references, because choices are shuffled.
- Reading level: grade 7 for JO, grade 11 for Booty.
- Use her display name in feedback only if natural, exact case ("Booty", "JO"). Usually don't.
- Every item has a concept (3–6 words, the idea being proved) and a why (1–3 sentences that teach: why the right answer is right, and what the tempting wrong move gets wrong). The why must make her able to take the next one.
- stretch: one sentence pointing at the harder version of the same idea ("Next rung: …"). Required on every question.
- Short answers ("own words"): the prompt must be answerable in 1–3 sentences or a single expression. acceptable = 2–5 model answers or key-idea statements the grader will match semantically.

FACT-CHECK CONTRACT
- Established curriculum knowledge only. No contested claims. No medical advice as diagnosis. No politics-as-gotcha.
- Health / finance / marketing stay age-appropriate and factual.
- Thin topic → review the surrounding unit (and lean toward the upcoming idea) rather than invent trivia.
- Deep Orbit must be a real, checkable, interesting fact, one level harder than the lesson.
- Signal shorts ("Did you know") must be true, checkable and current-feeling. Prefer a 21st-century hook (JWST, Iowa wind and ag data, polynomial patterns in music, sports science, food chemistry) over tired trivia. Max ~40 words, 1–2 sentences. No question on the card.
- If you are not sure a number is right, don't use the number.

VOICE
Quiet, warm, exact. Not cutesy, not corporate. Never "fun fact!!", never "you've got this!", never "nice try".

MATH / FORMATTING
Plain text a phone renders: x^2, (2x - 3)(x + 5), 3/4, -2.5, sqrt(2). No LaTeX, no markdown tables. Keep prompts tight — one screen on a phone.`;

// ── Tool schemas ─────────────────────────────────────────────
const questionSchemaJson = {
  type: 'object',
  required: ['type', 'prompt', 'concept', 'why', 'stretch'],
  properties: {
    type: { type: 'string', enum: ['mc', 'short'] },
    prompt: { type: 'string' },
    choices: { type: 'array', items: { type: 'string' }, description: 'mc only: exactly 4' },
    correctIndex: { type: 'integer', description: 'mc only: 0–3' },
    acceptable: { type: 'array', items: { type: 'string' }, description: 'short only: 2–5 model answers' },
    concept: { type: 'string' },
    why: { type: 'string' },
    stretch: { type: 'string' },
  },
};

const PART_A_TOOL = {
  name: 'emit_mission_part_a',
  description: 'Questions 1–4 and the three signal shorts.',
  input_schema: {
    type: 'object',
    required: ['questions', 'shorts'],
    properties: {
      questions: { type: 'array', items: questionSchemaJson, description: 'Exactly 4: mc, mc, mc, short' },
      shorts: {
        type: 'array',
        description: 'Exactly 3, in order: [0] tied to today\'s topic, [1] adjacent stretch, [2] wild-card from any field',
        items: {
          type: 'object',
          required: ['subject', 'text', 'related'],
          properties: {
            subject: { type: 'string', description: '1–3 word tag, e.g. "Europa", "Iowa wind", "Chord math"' },
            text: { type: 'string', description: '1–2 sentences, max ~40 words, true and checkable' },
            related: { type: 'boolean', description: "true only if it is about today's topic itself" },
          },
        },
      },
    },
  },
};

const PART_B_TOOL = {
  name: 'emit_mission_part_b',
  description: 'Questions 5–8 and the Deep Orbit bonus.',
  input_schema: {
    type: 'object',
    required: ['questions', 'bonus'],
    properties: {
      questions: { type: 'array', items: questionSchemaJson, description: 'Exactly 4: mc, mc, mc, short' },
      bonus: {
        type: 'object',
        required: ['type', 'prompt', 'fact', 'why', 'topicLabel'],
        properties: {
          type: { type: 'string', enum: ['mc', 'short'] },
          prompt: { type: 'string' },
          fact: { type: 'string', description: 'The real, checkable fact behind the question (1–2 sentences)' },
          choices: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          acceptable: { type: 'array', items: { type: 'string' }, description: 'Always give 2–4 — she may write instead of choosing' },
          why: { type: 'string' },
          topicLabel: { type: 'string', description: '2–5 words naming where this goes, e.g. "Polynomial identities"' },
        },
      },
    },
  },
};

// ── Validation (lenient on shape, strict on substance) ───────
const str = (min = 1) => z.string().transform((s) => s.trim()).pipe(z.string().min(min));

const Q = z
  .object({
    type: z.enum(['mc', 'short']),
    prompt: str(8),
    choices: z.array(str(1)).optional(),
    correctIndex: z.coerce.number().int().optional(),
    acceptable: z.array(str(1)).optional(),
    concept: str(2),
    why: str(10),
    stretch: str(5).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === 'mc') {
      if (!q.choices || q.choices.length !== 4) ctx.addIssue({ code: 'custom', message: 'mc needs exactly 4 choices' });
      else if (new Set(q.choices.map((c) => c.toLowerCase())).size !== 4) ctx.addIssue({ code: 'custom', message: 'mc choices must be distinct' });
      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3)
        ctx.addIssue({ code: 'custom', message: 'mc needs correctIndex 0–3' });
      if (q.choices?.some((c) => /\b(all|none) of the above\b|\bboth [a-d] and [a-d]\b/i.test(c)))
        ctx.addIssue({ code: 'custom', message: 'no all/none of the above' });
    } else if (!q.acceptable || q.acceptable.length < 1) {
      ctx.addIssue({ code: 'custom', message: 'short needs acceptable answers' });
    }
  });

const PartA = z.object({
  questions: z.array(Q).length(4),
  shorts: z
    .array(z.object({ subject: str(1), text: str(20), related: z.boolean() }))
    .length(3),
});

const PartB = z.object({
  questions: z.array(Q).length(4),
  bonus: z
    .object({
      type: z.enum(['mc', 'short']),
      prompt: str(8),
      fact: str(10),
      choices: z.array(str(1)).optional(),
      correctIndex: z.coerce.number().int().optional(),
      acceptable: z.array(str(1)).optional(),
      why: str(10),
      topicLabel: str(2),
    })
    .superRefine((b, ctx) => {
      if (b.type === 'mc' && (!b.choices || b.choices.length !== 4 || b.correctIndex === undefined || b.correctIndex < 0 || b.correctIndex > 3))
        ctx.addIssue({ code: 'custom', message: 'mc bonus needs 4 choices + correctIndex' });
      if (b.type === 'short' && (!b.acceptable || b.acceptable.length < 1))
        ctx.addIssue({ code: 'custom', message: 'short bonus needs acceptable answers' });
    }),
});

function checkTypes(questions: Array<{ type: string }>): string | null {
  const pattern = questions.map((q) => q.type).join(',');
  return pattern === 'mc,mc,mc,short' ? null : `question types must be mc,mc,mc,short (got ${pattern})`;
}

// ── Prompt building ──────────────────────────────────────────
function briefing(inp: GenerateInput): string {
  const ctx = contextFor(inp.subject);
  const who =
    inp.learnerName === 'Booty'
      ? 'Booty — 11th grade, Iowa Connections Academy (Pearson Connexus). Topics are pasted from her Connexus planner.'
      : "JO — 7th grade, Interstate 35 CSD (I-35 Secondary, Truro, Iowa). Brick-and-mortar class; she types what class covered in plain language. She has no Connexus unit codes — never invent 'U4, L3' style codes for her.";
  const nudge =
    inp.grade === 11
      ? 'Then one notch toward the next lesson in the unit or an honors read of the same idea.'
      : 'Then one notch toward grade 8 on the same thread.';
  const heat =
    inp.lastScore === 8
      ? 'Her last mission in this subject was 8/8. The generator went soft — come in hotter tonight.'
      : inp.lastScore !== null && inp.lastScore <= 4
        ? `Her last mission in this subject was ${inp.lastScore}/8. Warmer scaffolds on Q1–Q2, still honest rigor after.`
        : inp.lastScore !== null
          ? `Her last mission in this subject was ${inp.lastScore}/8.`
          : 'First mission in this subject. Still default push (difficulty 3 feel).';

  const lines = [
    `CREW: ${who}`,
    `GRADE: ${inp.grade}`,
    `SUBJECT: ${inp.subject}`,
    `TYPED TOPIC (source of truth): "${inp.topic.raw}"`,
    inp.topic.unit ? `PARSED: unit ${inp.topic.unit}, lesson ${inp.topic.lesson}, concept "${inp.topic.title}"` : `CONCEPT: "${inp.topic.title}"`,
    inp.note ? `HER NOTE: "${inp.note}"` : '',
    `DIFFICULTY: ${inp.difficulty} of 5. ${nudge}`,
    heat,
    ctx ? `COURSE NOW (fall 2026): ${ctx.now.join('; ')}` : `COURSE: not in the standard list — stay tightly on the typed topic at grade ${inp.grade}.`,
    ctx ? `COURSE NEXT: ${ctx.next.join('; ')}` : '',
    ctx?.guardrails ? `GUARDRAILS: ${ctx.guardrails}` : '',
    inp.recentTopics.length ? `RECENT MISSIONS IN THIS SUBJECT (don't repeat the same items): ${inp.recentTopics.join(' | ')}` : '',
    `DATE: ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', dateStyle: 'long' })}. Questions must feel like this week and next week, not a 2019 review packet.`,
    inp.subject === 'Algebra 2 A' && /polynomial multiplication/i.test(inp.topic.title) && inp.difficulty >= 4
      ? 'At this difficulty also weave in successive differences (e.g. the 3rd differences of a cubic are constant).'
      : '',
  ];
  return lines.filter(Boolean).join('\n');
}

const PART_A_ASK = `Write PART A of tonight's mission.
- Q1–Q2 (mc, mc): prove she still holds today's lesson. Not trivial recognition — make her do the move once.
- Q3 (mc): apply it harder — new numbers, a new text, a new case.
- Q4 (short, own words): apply it harder — explain or produce, in 1–3 sentences or one expression.
- 3 signal shorts, in order: [0] tied to today's topic, [1] an adjacent stretch, [2] a wild-card from any field (space, language, sports science, Iowa, music, food chemistry). At least one must be off-topic on purpose. True, surprising, current-feeling.
Another author is writing Q5–Q8 separately (models, what-ifs, error analysis, transfer) — so keep Q1–Q4 on direct holding and applying.`;

const PART_B_ASK = `Write PART B of tonight's mission.
- Q5–Q6 (mc, mc): apply it harder in a different shape than a plain drill — a model, a data table, a "what if", or find-the-error in a worked example.
- Q7 (mc): transfer — the next idea in the unit, or the same idea in a stranger setting.
- Q8 (short, own words): transfer — she must reason, not recognize.
- Deep Orbit bonus: a fun, more advanced fact-question adjacent to today's topic, one level harder than the lesson. Real and checkable. Prefer mc with 4 choices, and ALWAYS include acceptable answers too (she may choose to write instead).
Another author is writing Q1–Q4 (direct holding and applying) separately — do not duplicate that work.`;

type PartAOut = z.infer<typeof PartA>;
type PartBOut = z.infer<typeof PartB>;

async function runPart<T>(
  which: 'A' | 'B',
  inp: GenerateInput,
  started: number,
): Promise<T> {
  const tool = which === 'A' ? PART_A_TOOL : PART_B_TOOL;
  const schema = which === 'A' ? PartA : PartB;
  const base = `${briefing(inp)}\n\n${which === 'A' ? PART_A_ASK : PART_B_ASK}`;
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const elapsed = Date.now() - started;
    if (attempt > 0 && elapsed > 14_000) break; // no time for a second pass inside the function budget
    const user = attempt === 0 ? base : `${base}\n\nYour previous attempt failed validation: ${lastErr}. Fix it exactly.`;
    try {
      const raw = await callTool<unknown>({
        model: GENERATION_MODEL(),
        system: SYSTEM,
        user,
        tool,
        maxTokens: 3200,
        timeoutMs: Math.max(8_000, 26_000 - elapsed),
      });
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        lastErr = parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        continue;
      }
      const typeErr = checkTypes((parsed.data as { questions: Array<{ type: string }> }).questions);
      if (typeErr) {
        lastErr = typeErr;
        continue;
      }
      if (which === 'A' && (parsed.data as PartAOut).shorts.every((s) => s.related)) {
        lastErr = 'at least one signal short must be off-topic (related: false)';
        continue;
      }
      return parsed.data as T;
    } catch (err) {
      if (err instanceof HttpError && err.status !== 502) throw err;
      lastErr = err instanceof Error ? err.message : 'unknown';
    }
  }
  console.error(`[abl] part ${which} failed:`, lastErr);
  throw new HttpError(502, 'The transmission came back garbled. Generate again.');
}

function shuffleMc<T extends { choices?: string[]; correctIndex?: number }>(q: T): T {
  if (!q.choices || q.correctIndex === undefined) return q;
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, choices: order.map((i) => q.choices![i]), correctIndex: order.indexOf(q.correctIndex) };
}

const SHORT_LABELS = ['Did you know', 'Signal burst', 'One orbit over'] as const;
const AFTER: Array<2 | 4 | 6> = [2, 4, 6];

export async function generateMission(inp: GenerateInput): Promise<MissionPayload> {
  const started = Date.now();
  const [a, b] = await Promise.all([
    runPart<PartAOut>('A', inp, started),
    runPart<PartBOut>('B', inp, started),
  ]);

  const questions: MissionQuestion[] = [...a.questions, ...b.questions].map((q, i) => {
    const base: MissionQuestion = {
      id: `q${i + 1}`,
      type: q.type,
      prompt: q.prompt,
      concept: q.concept,
      why: q.why,
      stretch: q.stretch,
    };
    if (q.type === 'mc') return shuffleMc({ ...base, choices: q.choices, correctIndex: q.correctIndex });
    return { ...base, acceptable: q.acceptable };
  });

  const shorts: SignalShort[] = a.shorts.map((s, i) => ({
    id: `s${i + 1}`,
    afterQuestion: AFTER[i],
    text: s.text,
    tag: `${SHORT_LABELS[i]} · ${s.subject}`,
    related: s.related,
  }));

  const bonus = shuffleMc({ id: 'bonus', ...b.bonus });

  return {
    subject: inp.subject,
    topic: inp.topic.raw,
    grade: inp.grade,
    difficulty: inp.difficulty,
    ...(inp.topic.unit ? { unit: inp.topic.unit, lesson: inp.topic.lesson } : {}),
    questions,
    shorts,
    bonus,
  };
}
