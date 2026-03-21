// ---------------------------------------------------------------------------
// AI Pricing — shared types, constants, and helpers
// ---------------------------------------------------------------------------

export type OperationType =
  | 'question_generation'
  | 'answer_analysis'
  | 'chunk_enhancement'
  | 'content_generation';

export type AiProvider = 'google' | 'openai' | 'anthropic' | 'deepseek';

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

