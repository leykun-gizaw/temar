// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import type { AiProvider, OperationType } from '@temar/shared-types';

import {
  getActiveModels as _getActiveModels,
  getActivePricing as _getActivePricing,
  getActiveMarkup as _getActiveMarkup,
  getOperationConfig as _getOperationConfig,
  recordUsage as _recordUsage,
  updateMarkup as _updateMarkup,
  updateProviderPricing as _updateProviderPricing,
  invalidateModelCache as _invalidateModelCache,
  getCostPerPassUsd as _getCostPerPassUsd,
} from '@temar/pricing-service';

import type { RecordUsageParams as _RecordUsageParams } from '@temar/pricing-service';

// ---------------------------------------------------------------------------
// Re-exports from @temar/shared-types
// ---------------------------------------------------------------------------
export type {
  OperationType,
  AiProvider,
  ModelConfig,
  OperationConfig,
  TopupPack,
  TokenUsage,
} from '@temar/shared-types';

export {
  DEFAULT_MODEL_ID,
  PLAN_PASS_ALLOCATIONS,
  PLAN_PASS_ROLLOVER_CAPS,
} from '@temar/shared-types';

// ---------------------------------------------------------------------------
// Re-exports from @temar/pricing-service
// ---------------------------------------------------------------------------
export const getActiveModels = _getActiveModels;
export const getActivePricing = _getActivePricing;
export const getActiveMarkup = _getActiveMarkup;
export const getOperationConfig = _getOperationConfig;
export const recordUsage = _recordUsage;
export const updateMarkup = _updateMarkup;
export const updateProviderPricing = _updateProviderPricing;
export const invalidateModelCache = _invalidateModelCache;
export const getCostPerPassUsd = _getCostPerPassUsd;

export type RecordUsageParams = _RecordUsageParams;

// ---------------------------------------------------------------------------
// App-level helpers
// ---------------------------------------------------------------------------

/**
 * Whether the operation is free when the user provides their own API key
 * and has opted into BYOK mode.
 */
export async function isByokFree(
  operationType: OperationType,
  hasApiKey: boolean,
  useByok: boolean
): Promise<boolean> {
  if (!hasApiKey || !useByok) return false;
  try {
    const op = await _getOperationConfig(operationType);
    return op.isCurrentFeature;
  } catch {
    return false;
  }
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
