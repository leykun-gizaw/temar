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
  inputPricePer1M: number; // USD per 1M input tokens
  outputPricePer1M: number; // USD per 1M output tokens
}

export interface OperationConfig {
  label: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  isCurrentFeature: boolean;
}

// Cost basis per Pass (platform cost, not revenue).
// Starter plan: $9.99 / 200 Pass ≈ $0.05 revenue per Pass.
// We use ~$0.005 cost basis to allow a healthy margin.
const COST_PER_PASS = 0.005;

// Default model when user has no preference
export const DEFAULT_MODEL_ID = 'gemini-3-flash';

export const MODEL_CONFIGS: ModelConfig[] = [
  // ── Google ──
  {
    provider: 'google',
    modelId: 'gemini-3-flash',
    label: 'Gemini 3 Flash',
    inputPricePer1M: 0.1,
    outputPricePer1M: 0.4,
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.0,
  },
  // ── OpenAI ──
  {
    provider: 'openai',
    modelId: 'gpt-4.1-nano',
    label: 'GPT-4.1 Nano',
    inputPricePer1M: 0.1,
    outputPricePer1M: 0.4,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    inputPricePer1M: 0.4,
    outputPricePer1M: 1.6,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4.1',
    label: 'GPT-4.1',
    inputPricePer1M: 2.0,
    outputPricePer1M: 8.0,
  },
  {
    provider: 'openai',
    modelId: 'o4-mini',
    label: 'o4-mini',
    inputPricePer1M: 1.1,
    outputPricePer1M: 4.4,
  },
  // ── Anthropic ──
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-20250414',
    label: 'Claude Haiku 4',
    inputPricePer1M: 0.8,
    outputPricePer1M: 4.0,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4',
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
  },
];

export const OPERATION_CONFIGS: Record<OperationType, OperationConfig> = {
  question_generation: {
    label: 'Question Generation',
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    isCurrentFeature: true,
  },
  answer_analysis: {
    label: 'Answer Analysis',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    isCurrentFeature: true,
  },
  chunk_enhancement: {
    label: 'Chunk Enhancement',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    isCurrentFeature: false,
  },
  content_generation: {
    label: 'Content Generation',
    maxInputTokens: 8000,
    maxOutputTokens: 4000,
    isCurrentFeature: false,
  },
};

export const PLAN_PASS_ALLOCATIONS: Record<string, number> = {
  free: 0,
  starter: 200,
  scholar: 600,
};

export const PLAN_PASS_ROLLOVER_CAPS: Record<string, number> = {
  free: 0,
  starter: 60,
  scholar: 200,
};

export const TOPUP_PACKS = [
  {
    passAmount: 100,
    priceUsd: 3.99,
    priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID ?? '',
  },
  {
    passAmount: 300,
    priceUsd: 9.99,
    priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_300_PRICE_ID ?? '',
  },
  {
    passAmount: 600,
    priceUsd: 17.99,
    priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_600_PRICE_ID ?? '',
  },
];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find((m) => m.modelId === modelId);
}

/**
 * Calculate Pass cost for an operation + model using per-model token pricing.
 * Formula: (inputTokens * inputPrice + outputTokens * outputPrice) / COST_PER_PASS
 * Minimum 1 Pass.
 */
export function getPassCost(
  operationType: OperationType,
  modelId: string
): number {
  const model = getModelConfig(modelId);
  const op = OPERATION_CONFIGS[operationType];
  if (!op) return 1;
  if (!model) {
    // Unknown model — use the default model's pricing as fallback
    const fallback = getModelConfig(DEFAULT_MODEL_ID);
    if (!fallback) return 1;
    return computePassCost(fallback, op);
  }
  return computePassCost(model, op);
}

function computePassCost(model: ModelConfig, op: OperationConfig): number {
  const inputCost = (op.maxInputTokens / 1_000_000) * model.inputPricePer1M;
  const outputCost = (op.maxOutputTokens / 1_000_000) * model.outputPricePer1M;
  return Math.max(1, Math.ceil((inputCost + outputCost) / COST_PER_PASS));
}

/**
 * Whether the operation is free when the user provides their own API key
 * and has opted into BYOK mode.
 */
export function isByokFree(
  operationType: OperationType,
  hasApiKey: boolean,
  useByok: boolean
): boolean {
  if (!hasApiKey || !useByok) return false;
  return OPERATION_CONFIGS[operationType]?.isCurrentFeature ?? false;
}

export function estimateInputTokens(
  text: string,
  provider: AiProvider
): number {
  if (provider === 'openai') {
    return Math.ceil(text.length / 3.8);
  }
  return Math.ceil(text.length / 4);
}

/**
 * Estimate Pass cost for a specific amount of input tokens (may exceed the
 * base budget defined in the operation config).
 */
export function estimatedPassCostFromTokens(
  inputTokens: number,
  operationType: OperationType,
  modelId: string
): number {
  const model = getModelConfig(modelId);
  const op = OPERATION_CONFIGS[operationType];
  if (!model || !op) return 1;
  const baseCost = computePassCost(model, op);
  const baseTokenBudget = op.maxInputTokens;
  if (inputTokens <= baseTokenBudget) return baseCost;
  const overageRatio = inputTokens / baseTokenBudget;
  return Math.ceil(baseCost * overageRatio);
}
