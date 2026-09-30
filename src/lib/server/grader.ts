import { assertConfigured, callTool, graderModel } from './llm';
import { heuristicGrade } from '../grading';

const GRADER_SYSTEM = `You grade one short answer for ABL, a nightly practice system. Grade semantically: accept equivalent wording, synonyms, different but correct examples, and minor spelling or notation slips. Require the key idea — a vague answer that dodges the concept is not correct. An answer that is mostly right with a real conceptual error is not correct.

Feedback: 1–2 sentences, warm and exact, speaking to her ("you"). If correct, name what she just proved. If not, name the missing piece plainly — never shame, never "nice try". Do not repeat the full model answer; the app shows it.`;

const GRADE_TOOL = {
  name: 'grade',
  description: 'Return the grade for this short answer.',
  input_schema: {
    type: 'object',
    required: ['correct', 'feedback'],
    properties: {
      correct: { type: 'boolean' },
      feedback: { type: 'string' },
    },
  },
};

export async function gradeShortAnswer(opts: {
  grade: number;
  subject: string;
  prompt: string;
  acceptable: string[];
  why: string;
  answer: string;
}): Promise<{ correct: boolean; feedback: string }> {
  const answer = opts.answer.trim();
  if (answer.length < 1) return { correct: false, feedback: 'Nothing came through. Here is the missing piece.' };
  // Misconfigured provider (e.g. ABL_PROVIDER=gemini with no GEMINI_API_KEY) is a loud 503, not a silent fallback.
  assertConfigured();
  try {
    const out = await callTool<{ correct: boolean; feedback: string }>({
      model: graderModel(),
      system: GRADER_SYSTEM,
      user: [
        `Grade level: ${opts.grade}. Subject: ${opts.subject}.`,
        `Question: ${opts.prompt}`,
        `Acceptable answers / key ideas:\n- ${opts.acceptable.join('\n- ')}`,
        `Why (teacher notes): ${opts.why}`,
        `Her answer: """${answer.slice(0, 1200)}"""`,
      ].join('\n\n'),
      tool: GRADE_TOOL,
      maxTokens: 300,
      timeoutMs: 15_000,
      temperature: 0,
    });
    return { correct: Boolean(out.correct), feedback: String(out.feedback ?? '').slice(0, 400) };
  } catch (err) {
    console.error('[abl] grader fallback', err instanceof Error ? err.message : err);
    return heuristicGrade(answer, opts.acceptable);
  }
}
