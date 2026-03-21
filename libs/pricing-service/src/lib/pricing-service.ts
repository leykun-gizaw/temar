import {
  queryActiveModels,
  queryActivePricing,
  queryActiveMarkup,
  queryOperationConfig,
  insertUsageLog,
  decrementUserPassBalance,
  closeActivePricingRow,
  insertPricingRow,
  closeActiveMarkupRow,
  insertMarkupRow,
  withTransaction,
} from '@temar/db-client';

import type {
  ModelConfig,
  OperationConfig,
  OperationType,
} from '@temar/shared-types';

// ---------------------------------------------------------------------------
// In-memory cache with TTL
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 1 minute

const pricingCache = new Map<string, CacheEntry<{ inputPricePer1M: number; outputPricePer1M: number }>>();
const markupCache = new Map<string, CacheEntry<{ markupFactor: number }>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Public API — read functions
// ---------------------------------------------------------------------------

/**
 * Get all active AI models as ModelConfig DTOs (includes pricing + markup).
 */
export async function getActiveModels(): Promise<ModelConfig[]> {
  const models = await queryActiveModels();
  const configs: ModelConfig[] = [];

  for (const m of models) {
    const pricing = await getActivePricing(m.id);
    const markup = await getActiveMarkup(m.id);

    configs.push({
      provider: m.provider as ModelConfig['provider'],
      modelId: m.id,
      label: m.label,
      inputPricePer1M: pricing.inputPricePer1M,
      outputPricePer1M: pricing.outputPricePer1M,
      markupFactor: markup.markupFactor,
    });
  }

  return configs;
}

/**
 * Get the active pricing for a model (cached, 5-min TTL).
 * Throws if no active pricing row exists.
 */
export async function getActivePricing(modelId: string) {
  const cached = getCached(pricingCache, modelId);
  if (cached) return cached;

  const row = await queryActivePricing(modelId);
  if (!row) throw new Error(`No active pricing found for model: ${modelId}`);

  const data = {
    inputPricePer1M: row.inputPricePer1M,
    outputPricePer1M: row.outputPricePer1M,
  };
  setCache(pricingCache, modelId, data);
  return data;
}

/**
 * Get the active markup for a model (cached, 5-min TTL).
 * Throws if no active markup row exists.
 */
export async function getActiveMarkup(modelId: string) {
  const cached = getCached(markupCache, modelId);
  if (cached) return cached;

  const row = await queryActiveMarkup(modelId);
  if (!row) throw new Error(`No active markup found for model: ${modelId}`);

  const data = { markupFactor: row.markupFactor };
  setCache(markupCache, modelId, data);
  return data;
}

/**
 * Flush pricing + markup cache for a specific model.
 */
export function invalidateModelCache(modelId: string): void {
  pricingCache.delete(modelId);
  markupCache.delete(modelId);
}

/**
 * Get an operation config by type. Throws if not found or inactive.
 */
export async function getOperationConfig(
  operationType: OperationType
): Promise<OperationConfig> {
  const row = await queryOperationConfig(operationType);
  if (!row)
    throw new Error(
      `No active operation config found for: ${operationType}`
    );
  return {
    label: row.label,
    maxInputTokens: row.maxInputTokens,
    maxOutputTokens: row.maxOutputTokens,
    isCurrentFeature: row.isCurrentFeature,
  };
}

// ---------------------------------------------------------------------------
// Public API — pass cost computation
// ---------------------------------------------------------------------------

export function getCostPerPassUsd(): number {
  const envVal = process.env['COST_PER_PASS_USD'];
  return envVal ? parseFloat(envVal) || 0.05 : 0.05;
}

/**
 * Compute the Pass cost for an operation + model (async, DB-driven).
 * Formula: ((input * inputPrice + output * outputPrice) * markup) / COST_PER_PASS
 * Minimum 1 Pass.
 */
export async function computePassCost(
  modelId: string,
  operationType: OperationType
): Promise<number> {
  const pricing = await getActivePricing(modelId);
  const markup = await getActiveMarkup(modelId);
  const opConfig = await getOperationConfig(operationType);

  const inputCost =
    (opConfig.maxInputTokens / 1_000_000) * pricing.inputPricePer1M;
  const outputCost =
    (opConfig.maxOutputTokens / 1_000_000) * pricing.outputPricePer1M;

  return (inputCost + outputCost) * markup.markupFactor;
}

/**
 * Estimate Pass cost for a specific amount of input tokens (may exceed the
 * base budget defined in the operation config). Synchronous version that
 * accepts pre-fetched config.
 */
export function estimatedPassCostFromTokens(
  inputTokens: number,
  operationType: OperationType,
  modelConfig: ModelConfig,
  opConfig: OperationConfig
): number {
  const inputCost =
    (opConfig.maxInputTokens / 1_000_000) * modelConfig.inputPricePer1M;
  const outputCost =
    (opConfig.maxOutputTokens / 1_000_000) * modelConfig.outputPricePer1M;
  const baseCost =
    (inputCost + outputCost) * modelConfig.markupFactor;

  if (inputTokens <= opConfig.maxInputTokens) return baseCost;
  const overageRatio = inputTokens / opConfig.maxInputTokens;
  return baseCost * overageRatio;
}

// ---------------------------------------------------------------------------
// Public API — usage recording
// ---------------------------------------------------------------------------

export interface RecordUsageParams {
  userId: string;
  modelId: string;
  operationType: OperationType;
  inputTokens: number;
  outputTokens: number;
  isByok: boolean;
}

/**
 * Atomic transaction: insert usage log + decrement pass balance.
 * If isByok is true, the usage is logged but no passes are deducted.
 * Returns { passCharged, newBalance }.
 */
export async function recordUsage(
  params: RecordUsageParams
): Promise<{ amountChargedUsd: number; newBalance: number | null }> {
  const { userId, modelId, operationType, inputTokens, outputTokens, isByok } =
    params;

  const pricing = await getActivePricing(modelId);
  const markup = await getActiveMarkup(modelId);

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePer1M;
  const computedCostUsd = (inputCost + outputCost) * markup.markupFactor;
  const amountChargedUsd = isByok ? 0 : computedCostUsd;

  return withTransaction(async (tx) => {
    await insertUsageLog(
      {
        userId,
        modelId,
        operationType,
        inputTokens,
        outputTokens,
        inputPricePer1MSnapshot: pricing.inputPricePer1M,
        outputPricePer1MSnapshot: pricing.outputPricePer1M,
        markupFactorSnapshot: markup.markupFactor,
        computedCostUsd,
        amountChargedUsd,
        isByok,
      },
      tx
    );

    let newBalance: number | null = null;
    if (!isByok && amountChargedUsd > 0) {
      const result = await decrementUserPassBalance(userId, amountChargedUsd, tx);
      newBalance = result?.balanceUsd ?? null;
    }

    return { amountChargedUsd, newBalance };
  });
}

// ---------------------------------------------------------------------------
// Public API — admin functions (for future admin panel)
// ---------------------------------------------------------------------------

/**
 * Update markup for a model. Closes old row, inserts new, invalidates cache.
 */
export async function updateMarkup(
  modelId: string,
  factor: number,
  reason?: string
): Promise<void> {
  await withTransaction(async (tx) => {
    await closeActiveMarkupRow(modelId, tx);
    await insertMarkupRow(
      { modelId, markupFactor: factor, changeReason: reason },
      tx
    );
  });
  invalidateModelCache(modelId);
}

/**
 * Update provider pricing for a model. Closes old row, inserts new, invalidates cache.
 */
export async function updateProviderPricing(
  modelId: string,
  inputPricePer1M: number,
  outputPricePer1M: number,
  reason?: string
): Promise<void> {
  await withTransaction(async (tx) => {
    await closeActivePricingRow(modelId, tx);
    await insertPricingRow(
      { modelId, inputPricePer1M, outputPricePer1M, changeReason: reason },
      tx
    );
  });
  invalidateModelCache(modelId);
}
