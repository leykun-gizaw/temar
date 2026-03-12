export type OperationType =
  | 'question_generation'
  | 'answer_analysis'
  | 'chunk_enhancement'
  | 'content_generation';

export type ModelTier = 'economy' | 'standard' | 'premium';

export type AiProvider = 'google' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: AiProvider;
  modelId: string;
  label: string;
  tier: ModelTier;
}

export interface OperationConfig {
  label: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  passCost: Record<ModelTier, number>;
  byokCurrentFeature: boolean;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    tier: 'economy',
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    tier: 'economy',
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    tier: 'premium',
  },
  {
    provider: 'openai',
    modelId: 'gpt-4.1-nano',
    label: 'GPT-4.1 Nano',
    tier: 'economy',
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    tier: 'economy',
  },
  {
    provider: 'openai',
    modelId: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    tier: 'standard',
  },
  { provider: 'openai', modelId: 'gpt-4o', label: 'GPT-4o', tier: 'standard' },
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-20250414',
    label: 'Claude Haiku 4',
    tier: 'standard',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4',
    tier: 'premium',
  },
];

export const OPERATION_CONFIGS: Record<OperationType, OperationConfig> = {
  question_generation: {
    label: 'Question Generation',
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    passCost: { economy: 3, standard: 6, premium: 12 },
    byokCurrentFeature: true,
  },
  answer_analysis: {
    label: 'Answer Analysis',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    passCost: { economy: 1, standard: 2, premium: 5 },
    byokCurrentFeature: true,
  },
  chunk_enhancement: {
    label: 'Chunk Enhancement',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    passCost: { economy: 2, standard: 4, premium: 8 },
    byokCurrentFeature: false,
  },
  content_generation: {
    label: 'Content Generation',
    maxInputTokens: 8000,
    maxOutputTokens: 4000,
    passCost: { economy: 5, standard: 10, premium: 20 },
    byokCurrentFeature: false,
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

export function getPassCost(
  operationType: OperationType,
  modelId: string
): number {
  const model = getModelConfig(modelId);
  const op = OPERATION_CONFIGS[operationType];
  if (!model || !op) return op?.passCost.economy ?? 1;
  return op.passCost[model.tier];
}

export function isByokFree(
  operationType: OperationType,
  hasApiKey: boolean
): boolean {
  if (!hasApiKey) return false;
  return OPERATION_CONFIGS[operationType]?.byokCurrentFeature ?? false;
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

export function estimatedPassCostFromTokens(
  inputTokens: number,
  operationType: OperationType,
  modelId: string
): number {
  const model = getModelConfig(modelId);
  const op = OPERATION_CONFIGS[operationType];
  if (!model || !op) return op?.passCost.economy ?? 1;
  const baseTokenBudget = op.maxInputTokens;
  const baseCost = op.passCost[model.tier];
  if (inputTokens <= baseTokenBudget) return baseCost;
  const overageRatio = inputTokens / baseTokenBudget;
  return Math.ceil(baseCost * overageRatio);
}
