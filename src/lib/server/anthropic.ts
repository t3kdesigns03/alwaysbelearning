import { env, requireEnv, HttpError } from './env';

export const GENERATION_MODEL = () => env('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5';
export const GRADER_MODEL = () => env('ANTHROPIC_GRADER_MODEL') ?? 'claude-haiku-4-5';

type Tool = { name: string; description: string; input_schema: Record<string, unknown> };

/**
 * One forced tool call → the tool's input object. Using a tool with a JSON
 * schema is the most reliable way to get JSON-only output from the Messages API.
 */
export async function callTool<T = unknown>(opts: {
  model: string;
  system: string;
  user: string;
  tool: Tool;
  maxTokens: number;
  timeoutMs: number;
  temperature?: number;
}): Promise<T> {
  const key = requireEnv('ANTHROPIC_API_KEY');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature ?? 0.7,
        system: opts.system,
        tools: [opts.tool],
        tool_choice: { type: 'tool', name: opts.tool.name },
        messages: [{ role: 'user', content: opts.user }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[abl] anthropic', res.status, body.slice(0, 300));
      if (res.status === 401) throw new HttpError(503, 'The Anthropic key was rejected. Check ANTHROPIC_API_KEY.');
      if (res.status === 429 || res.status === 529) throw new HttpError(503, 'The generator is busy. Give it a minute and try again.');
      throw new HttpError(502, 'The generator did not answer cleanly. Try again.');
    }
    const data = (await res.json()) as { content?: Array<{ type: string; name?: string; input?: unknown }>; stop_reason?: string };
    const block = data.content?.find((b) => b.type === 'tool_use' && b.name === opts.tool.name);
    if (!block?.input) throw new HttpError(502, 'The generator came back empty. Try again.');
    if (data.stop_reason === 'max_tokens') throw new Error('generator hit max_tokens');
    return block.input as T;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new HttpError(504, 'The generator took too long. Try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
