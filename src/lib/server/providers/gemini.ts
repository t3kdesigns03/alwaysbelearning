// Gemini Developer API adapter (AI Studio key): one forced function call → its args object.
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=…
import { requireEnv, HttpError } from '../env';
import type { CallToolOpts } from './types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Gemini's `parameters` is an OpenAPI-style Schema subset. Keep only the keywords it
// understands and use the canonical upper-case Type enum (OBJECT, STRING, …).
const KEEP = new Set(['type', 'description', 'properties', 'required', 'items', 'enum', 'nullable', 'format', 'minItems', 'maxItems']);

export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (!KEEP.has(k)) continue;
    if (k === 'type' && typeof v === 'string') out.type = v.toUpperCase();
    else if (k === 'properties' && v && typeof v === 'object') {
      out.properties = Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([pk, pv]) => [pk, toGeminiSchema(pv)]));
    } else if (k === 'items') out.items = toGeminiSchema(v);
    else out[k] = v;
  }
  return out;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ functionCall?: { name?: string; args?: unknown }; text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

export async function geminiCallTool<T = unknown>(opts: CallToolOpts): Promise<T> {
  const key = requireEnv('GEMINI_API_KEY');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  const url = `${BASE}/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.user }] }],
        tools: [
          {
            functionDeclarations: [
              { name: opts.tool.name, description: opts.tool.description, parameters: toGeminiSchema(opts.tool.input_schema) },
            ],
          },
        ],
        toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [opts.tool.name] } },
        generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxTokens },
      }),
    });
    if (!res.ok) {
      // Never log the URL — it carries the key.
      const body = await res.text().catch(() => '');
      console.error('[abl] gemini', res.status, body.slice(0, 300));
      if (res.status === 400 && /api key/i.test(body)) throw new HttpError(503, 'The Gemini key was rejected. Check GEMINI_API_KEY.');
      if (res.status === 401 || res.status === 403) throw new HttpError(503, 'The Gemini key was rejected. Check GEMINI_API_KEY.');
      if (res.status === 404) throw new HttpError(503, `Gemini doesn't know the model "${opts.model}". Check GEMINI_MODEL / GEMINI_GRADER_MODEL.`);
      if (res.status === 429 || res.status === 503) throw new HttpError(503, 'The generator is busy. Give it a minute and try again.');
      throw new HttpError(502, 'The generator did not answer cleanly. Try again.');
    }
    const data = (await res.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason) throw new HttpError(502, 'The generator declined that request. Rephrase the topic and try again.');
    const cand = data.candidates?.[0];
    const call = cand?.content?.parts?.find((p) => p.functionCall && p.functionCall.name === opts.tool.name)?.functionCall;
    if (!call?.args) {
      if (cand?.finishReason === 'MAX_TOKENS') throw new Error('generator hit max_tokens');
      throw new HttpError(502, 'The generator came back empty. Try again.');
    }
    if (cand?.finishReason === 'MAX_TOKENS') throw new Error('generator hit max_tokens');
    return call.args as T;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new HttpError(504, 'The generator took too long. Try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
