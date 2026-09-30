// Shared shapes for the LLM provider adapters. Server only.

/** A tool described with JSON Schema (Anthropic's `input_schema` shape; Gemini gets it converted). */
export type Tool = { name: string; description: string; input_schema: Record<string, unknown> };

export type CallToolOpts = {
  model: string;
  system: string;
  user: string;
  tool: Tool;
  maxTokens: number;
  timeoutMs: number;
  temperature?: number;
};

export type Provider = 'anthropic' | 'gemini';
