// ─────────────────────────────────────────────────────────────
// LLM facade. Generator and grader call this; it routes to the
// provider named by ABL_PROVIDER (anthropic | gemini).
//
//   ABL_PROVIDER=gemini    → Gemini only. Missing GEMINI_API_KEY → 503.
//   ABL_PROVIDER=anthropic → Anthropic only. Missing ANTHROPIC_API_KEY → 503.
//   unset                  → whichever key exists (Anthropic first), else 503.
// A configured provider never silently falls through to the other one.
// ─────────────────────────────────────────────────────────────
import { env, HttpError } from './env';
import { anthropicCallTool } from './providers/anthropic';
import { geminiCallTool } from './providers/gemini';
import type { CallToolOpts, Provider, Tool } from './providers/types';

export type { Tool, CallToolOpts, Provider };

const KEY: Record<Provider, string> = { anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY' };

const DEFAULT_MODELS: Record<Provider, { generate: string; grade: string }> = {
  anthropic: { generate: 'claude-sonnet-4-5', grade: 'claude-haiku-4-5' },
  gemini: { generate: 'gemini-2.5-flash', grade: 'gemini-2.5-flash-lite' },
};

/** Which provider is in charge. Throws 503 on a bad ABL_PROVIDER value. */
export function provider(): Provider {
  const raw = env('ABL_PROVIDER')?.toLowerCase();
  if (raw === 'anthropic' || raw === 'gemini') return raw;
  if (raw) throw new HttpError(503, `ABL_PROVIDER must be "anthropic" or "gemini" (got "${raw}").`);
  if (env('ANTHROPIC_API_KEY')) return 'anthropic';
  if (env('GEMINI_API_KEY')) return 'gemini';
  return 'anthropic';
}

/** 503 unless the active provider has its key. Never falls through to the other provider. */
export function assertConfigured(): Provider {
  const p = provider();
  if (!env(KEY[p])) {
    const why = env('ABL_PROVIDER') ? ` (ABL_PROVIDER=${p})` : '';
    throw new HttpError(503, `Server is missing ${KEY[p]}${why}. See README → Environment.`);
  }
  return p;
}

export function generationModel(): string {
  const p = provider();
  return (p === 'gemini' ? env('GEMINI_MODEL') : env('ANTHROPIC_MODEL')) ?? DEFAULT_MODELS[p].generate;
}

export function graderModel(): string {
  const p = provider();
  return (p === 'gemini' ? env('GEMINI_GRADER_MODEL') : env('ANTHROPIC_GRADER_MODEL')) ?? DEFAULT_MODELS[p].grade;
}

/** One forced tool/function call → its arguments as T. */
export async function callTool<T = unknown>(opts: CallToolOpts): Promise<T> {
  const p = assertConfigured();
  return p === 'gemini' ? geminiCallTool<T>(opts) : anthropicCallTool<T>(opts);
}
