import { eq, and, isNull, sql } from 'drizzle-orm';
import { dbClient, type DbClient } from './db-client';
import {
  aiModel,
  aiModelPricing,
  aiMarkupConfig,
  operationConfig,
  aiUsageLog,
} from '../schema/ai-pricing-schema';
import { passBalance } from '../schema/pass-schema';

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export async function queryActiveModels() {
  return dbClient
    .select()
    .from(aiModel)
    .where(eq(aiModel.isActive, true));
}

export async function queryProviderModelId(
  pricingModelId: string
): Promise<string> {
  const [row] = await dbClient
    .select({ providerModelId: aiModel.providerModelId })
    .from(aiModel)
    .where(eq(aiModel.id, pricingModelId))
    .limit(1);
  // Falls back to the pricing model ID itself when no override is set
  return row?.providerModelId ?? pricingModelId;
}

export async function queryActivePricing(modelId: string) {
  const [row] = await dbClient
    .select()
    .from(aiModelPricing)
    .where(
      and(
        eq(aiModelPricing.modelId, modelId),
        isNull(aiModelPricing.effectiveTo)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function queryActiveMarkup(modelId: string) {
  const [row] = await dbClient
    .select()
    .from(aiMarkupConfig)
    .where(
      and(
        eq(aiMarkupConfig.modelId, modelId),
        isNull(aiMarkupConfig.effectiveTo)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function queryOperationConfig(operationType: string) {
  const [row] = await dbClient
    .select()
    .from(operationConfig)
    .where(
      and(
        eq(operationConfig.operationType, operationType),
        eq(operationConfig.isActive, true)
      )
    )
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Write queries
// ---------------------------------------------------------------------------

export interface InsertUsageLogData {
  userId: string;
  modelId: string;
  operationType: string;
  inputTokens: number;
  outputTokens: number;
  inputPricePer1MSnapshot: number;
  outputPricePer1MSnapshot: number;
  markupFactorSnapshot: number;
  computedCostUsd: number;
  amountChargedUsd: number;
  isByok: boolean;
}

export async function insertUsageLog(
  data: InsertUsageLogData,
  tx?: DbClient
) {
  const db = tx ?? dbClient;
  const [row] = await db
    .insert(aiUsageLog)
    .values(data)
    .returning({ id: aiUsageLog.id });
  return row;
}

/**
 * Decrement the user's pass balance, consuming subscription passes first
 * (they expire at rollover) and top-up passes only after the subscription
 * portion is exhausted.
 */
export async function decrementUserPassBalance(
  userId: string,
  amount: number,
  tx?: DbClient
) {
  const db = tx ?? dbClient;

  const [current] = await db
    .select({
      balanceUsd: passBalance.balanceUsd,
      topupBalanceUsd: passBalance.topupBalanceUsd,
    })
    .from(passBalance)
    .where(eq(passBalance.userId, userId))
    .limit(1);

  if (!current) {
    // No pass_balance row exists — create one with 0 balance.
    const [inserted] = await db
      .insert(passBalance)
      .values({ userId, balanceUsd: 0, topupBalanceUsd: 0 })
      .onConflictDoNothing()
      .returning({ balanceUsd: passBalance.balanceUsd });
    return inserted ?? null;
  }

  // Subscription portion = total - topup
  const subBalance = Math.max(0, current.balanceUsd - current.topupBalanceUsd);

  // Deduct from subscription first, then topup
  const subDeduction = Math.min(amount, subBalance);
  const topupDeduction = Math.min(amount - subDeduction, current.topupBalanceUsd);

  const newBalanceUsd = Math.max(0, current.balanceUsd - amount);
  const newTopupUsd = Math.max(0, current.topupBalanceUsd - topupDeduction);

  const [row] = await db
    .update(passBalance)
    .set({
      balanceUsd: newBalanceUsd,
      topupBalanceUsd: newTopupUsd,
    })
    .where(eq(passBalance.userId, userId))
    .returning({ balanceUsd: passBalance.balanceUsd });

  return row ?? null;
}

// ---------------------------------------------------------------------------
// Admin / versioning helpers
// ---------------------------------------------------------------------------

export async function closeActivePricingRow(
  modelId: string,
  tx?: DbClient
) {
  const db = tx ?? dbClient;
  const now = new Date();
  await db
    .update(aiModelPricing)
    .set({ effectiveTo: now })
    .where(
      and(
        eq(aiModelPricing.modelId, modelId),
        isNull(aiModelPricing.effectiveTo)
      )
    );
}

export interface InsertPricingRowData {
  modelId: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  changeReason?: string;
}

export async function insertPricingRow(
  data: InsertPricingRowData,
  tx?: DbClient
) {
  const db = tx ?? dbClient;
  const [row] = await db
    .insert(aiModelPricing)
    .values(data)
    .returning();
  return row;
}

export async function closeActiveMarkupRow(
  modelId: string,
  tx?: DbClient
) {
  const db = tx ?? dbClient;
  const now = new Date();
  await db
    .update(aiMarkupConfig)
    .set({ effectiveTo: now })
    .where(
      and(
        eq(aiMarkupConfig.modelId, modelId),
        isNull(aiMarkupConfig.effectiveTo)
      )
    );
}

export interface InsertMarkupRowData {
  modelId: string;
  markupFactor: number;
  changeReason?: string;
}

export async function insertMarkupRow(
  data: InsertMarkupRowData,
  tx?: DbClient
) {
  const db = tx ?? dbClient;
  const [row] = await db
    .insert(aiMarkupConfig)
    .values(data)
    .returning();
  return row;
}
