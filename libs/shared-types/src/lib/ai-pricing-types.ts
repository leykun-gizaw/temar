// ---------------------------------------------------------------------------
// AI Pricing — shared types, constants, and helpers
// ---------------------------------------------------------------------------

export type OperationType =
  | 'question_generation'
  | 'answer_analysis'
  | 'chunk_enhancement'
  | 'content_generation';

export type AiProvider = 'google' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: AiProvider;
  modelId: string;
  label: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  markupFactor: number;
}

export interface OperationConfig {
  label: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  isCurrentFeature: boolean;
}

export interface TopupPack {
  passAmount: number;
  priceUsd: number;
  priceId: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL_ID = 'gemini-3-flash';

/**
 * Maps pricing model IDs (from the `ai_models` table) to the actual provider
 * model identifiers accepted by the Vercel AI SDK.
 *
 * Services must use the pricing ID for `recordUsage()` and map to the provider
 * ID only when calling the LLM.
 */
export const MODEL_PROVIDER_MAP: Record<string, string> = {
  'gemini-3-flash': 'gemini-2.0-flash',
  'gemini-2.5-flash': 'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-pro': 'gemini-2.5-pro-preview-05-06',
  'gpt-4.1-nano': 'gpt-4.1-nano',
  'gpt-4.1-mini': 'gpt-4.1-mini',
  'gpt-4.1': 'gpt-4.1',
};

export const PLAN_PASS_ALLOCATIONS: Record<string, number> = {
  free: 0,
  starter: 100,
  hobbyist: 200,
  scholar: 300,
};

export const PLAN_PASS_ROLLOVER_CAPS: Record<string, number> = {
  free: 0,
  starter: 30,
  hobbyist: 60,
  scholar: 100,
};

// ---------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------

/**
 * Returns the TOPUP_PACKS array by reading Paddle price IDs from
 * environment variables at runtime. Uses bracket notation to prevent
 * Next.js from statically inlining NEXT_PUBLIC_ values at build time.
 */
export function getTopupPacks(): TopupPack[] {
  return [
    {
      passAmount: 50,
      priceUsd: 2.50,
      priceId: process.env['NEXT_PUBLIC_PADDLE_TOPUP_50_PRICE_ID'] ?? '',
    },
    {
      passAmount: 100,
      priceUsd: 4.99,
      priceId: process.env['NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID'] ?? '',
    },
  ];
}
