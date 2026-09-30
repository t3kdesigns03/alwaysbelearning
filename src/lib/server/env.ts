// Server-only env access. Reads runtime env on Netlify (process.env) and
// Vite's import.meta.env in `astro dev`. Never import this from an island.
// Static references so Vite/Astro can resolve them in `astro dev` (and at build).
// On Netlify, runtime process.env wins.
let viteEnv: Record<string, string | undefined> = {};
try {
  viteEnv = {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: import.meta.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: import.meta.env.ANTHROPIC_MODEL,
    ANTHROPIC_GRADER_MODEL: import.meta.env.ANTHROPIC_GRADER_MODEL,
    ABL_PROVIDER: import.meta.env.ABL_PROVIDER,
    GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
    GEMINI_MODEL: import.meta.env.GEMINI_MODEL,
    GEMINI_GRADER_MODEL: import.meta.env.GEMINI_GRADER_MODEL,
  };
} catch {
  /* running outside Vite (scripts/tests) */
}

/** `.env.local` ships with `PASTE_…` placeholders; treat those exactly like a missing value. */
export function isPlaceholder(v: string | undefined | null): boolean {
  return !v || !v.trim() || /^PASTE_[A-Z0-9_]*$/.test(v.trim());
}

export function env(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const v = fromProcess || viteEnv[name];
  return isPlaceholder(v) ? undefined : v!.trim();
}

export function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new HttpError(503, `Server is missing ${name}. See README → Environment.`);
  return v;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** Wrap a handler so thrown HttpErrors become clean JSON and nothing sensitive leaks. */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async ({ request }: { request: Request }) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message, ...(err.extra ?? {}) }, err.status);
      console.error('[abl] unhandled', err instanceof Error ? err.message : err);
      return json({ error: 'Signal lost on our side. Try again in a moment.' }, 500);
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Expected a JSON body.');
  }
}
