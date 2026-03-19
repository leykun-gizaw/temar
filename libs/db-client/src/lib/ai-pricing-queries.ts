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

export async function decrementUserPassBalance(
  userId: string,
  amount: number,
  tx?: DbClient
) {
  const db = tx ?? dbClient;

  // Try to decrement the existing row, clamping to 0 (never go negative)
  const [row] = await db
    .update(passBalance)
    .set({
      balanceUsd: sql`GREATEST(0, ${passBalance.balanceUsd} - ${amount})`,
    })
    .where(eq(passBalance.userId, userId))
    .returning({ balanceUsd: passBalance.balanceUsd });

  if (row) return row;

  // No pass_balance row exists — create one with 0 balance.
  // The usage log still records the full passCharged for audit purposes.
  const [inserted] = await db
    .insert(passBalance)
    .values({ userId, balanceUsd: 0 })
    .onConflictDoNothing()
    .returning({ balanceUsd: passBalance.balanceUsd });

  return inserted ?? null;
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
