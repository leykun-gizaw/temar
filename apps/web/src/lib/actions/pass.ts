'use server';

import {
  dbClient,
  passBalance,
  passTransaction,
  user,
  eq,
  desc,
} from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { revalidatePath } from 'next/cache';
import type { OperationType } from '@/lib/config/ai-operations';
import {
  isByokFree,
  estimateInputTokens,
  computePassCost,
  estimatedPassCostFromTokens,
  getOperationConfig,
  getActiveModels,
} from '@/lib/config/ai-operations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PassBalanceInfo = {
  balance: number;
  plan: string;
};

export type CheckPassResult =
  | { status: 'ok'; passToDeduct: number; isByok: boolean }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | {
      status: 'consent_required';
      estimatedPassCost: number;
      basePassCost: number;
    };

export type DeductPassResult =
  | { status: 'ok'; passDeducted: number; newBalance: number }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | {
      status: 'consent_required';
      estimatedPassCost: number;
      basePassCost: number;
    };

// ---------------------------------------------------------------------------
// Balance queries
// ---------------------------------------------------------------------------

export async function getPassBalance(): Promise<PassBalanceInfo> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return { balance: 0, plan: 'free' };

  const [row] = await dbClient
    .select({
      balance: passBalance.balance,
      plan: user.plan,
    })
    .from(passBalance)
    .innerJoin(user, eq(user.id, passBalance.userId))
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  if (!row) {
    const [userRow] = await dbClient
      .select({ plan: user.plan })
      .from(user)
      .where(eq(user.id, sessionUser.id))
      .limit(1);
    return { balance: 0, plan: userRow?.plan ?? 'free' };
  }

  return { balance: row.balance, plan: row.plan ?? 'free' };
}

/** Lightweight balance-only fetch for real-time UI updates. */
export async function getPassBalanceQuick(): Promise<number> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return 0;

  const [row] = await dbClient
    .select({ balance: passBalance.balance })
    .from(passBalance)
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  return row?.balance ?? 0;
}

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

export async function creditPass(
  userId: string,
  amount: number,
  description: string,
  operationType = 'credit',
  paddleTransactionId?: string
): Promise<void> {
  await dbClient.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: passBalance.id, balance: passBalance.balance })
      .from(passBalance)
      .where(eq(passBalance.userId, userId))
      .limit(1);

    if (existing) {
      await tx
        .update(passBalance)
        .set({ balance: existing.balance + amount })
        .where(eq(passBalance.userId, userId));
    } else {
      await tx.insert(passBalance).values({ userId, balance: amount });
    }

    await tx.insert(passTransaction).values({
      userId,
      delta: amount,
      operationType,
      description,
      paddleTransactionId: paddleTransactionId ?? null,
    });
  });
}

// ---------------------------------------------------------------------------
// Check pass availability (does NOT deduct — call deductPass after success)
// ---------------------------------------------------------------------------

export async function checkPassAvailability(
  operationType: OperationType,
  modelId: string,
  inputText: string,
  provider: 'google' | 'openai' | 'anthropic',
  consentedPassCost?: number
): Promise<CheckPassResult> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { status: 'insufficient_pass', balance: 0, required: 1 };
  }

  const [userRow] = await dbClient
    .select({
      aiApiKeyEncrypted: user.aiApiKeyEncrypted,
      useByok: user.useByok,
      plan: user.plan,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  const hasApiKey = !!userRow?.aiApiKeyEncrypted;
  const useByok = userRow?.useByok ?? false;
  const byokFree = await isByokFree(operationType, hasApiKey, useByok);

  if (byokFree) {
    return { status: 'ok', passToDeduct: 0, isByok: true };
  }

  const basePassCost = await computePassCost(modelId, operationType);
  const inputTokens = estimateInputTokens(inputText, provider);

  const models = await getActiveModels();
  const modelCfg = models.find((m) => m.modelId === modelId);
  const opCfg = await getOperationConfig(operationType);
  const estimatedCost =
    modelCfg && opCfg
      ? estimatedPassCostFromTokens(inputTokens, operationType, modelCfg, opCfg)
      : basePassCost;

  const requiredCost = consentedPassCost ?? estimatedCost;

  if (estimatedCost > basePassCost && !consentedPassCost) {
    return {
      status: 'consent_required',
      estimatedPassCost: estimatedCost,
      basePassCost,
    };
  }

  const [balanceRow] = await dbClient
    .select({ balance: passBalance.balance })
    .from(passBalance)
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  const currentBalance = balanceRow?.balance ?? 0;

  if (currentBalance < requiredCost) {
    return {
      status: 'insufficient_pass',
      balance: currentBalance,
      required: requiredCost,
    };
  }

  return { status: 'ok', passToDeduct: requiredCost, isByok: false };
}

// ---------------------------------------------------------------------------
// Deduct pass (call AFTER the API call succeeds)
// ---------------------------------------------------------------------------

export async function deductPass(
  operationType: OperationType,
  passToDeduct: number
): Promise<{ newBalance: number }> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return { newBalance: 0 };
  if (passToDeduct <= 0) return { newBalance: await getPassBalanceQuick() };

  const [balanceRow] = await dbClient
    .select({ balance: passBalance.balance })
    .from(passBalance)
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  const currentBalance = balanceRow?.balance ?? 0;
  const newBalance = Math.max(0, currentBalance - passToDeduct);

  await dbClient.transaction(async (tx) => {
    await tx
      .update(passBalance)
      .set({ balance: newBalance })
      .where(eq(passBalance.userId, sessionUser.id));

    await tx.insert(passTransaction).values({
      userId: sessionUser.id,
      delta: -passToDeduct,
      operationType,
      description: `Used for ${operationType.replace(/_/g, ' ')}`,
    });
  });

  revalidatePath('/dashboard/billing');
  return { newBalance };
}

// ---------------------------------------------------------------------------
// Legacy wrapper — kept for backwards-compat during migration
// ---------------------------------------------------------------------------

export async function checkAndDeductPass(
  operationType: OperationType,
  modelId: string,
  inputText: string,
  provider: 'google' | 'openai' | 'anthropic',
  consentedPassCost?: number
): Promise<DeductPassResult> {
  const check = await checkPassAvailability(
    operationType,
    modelId,
    inputText,
    provider,
    consentedPassCost
  );

  if (check.status !== 'ok') return check;
  if (check.passToDeduct === 0) {
    return {
      status: 'ok',
      passDeducted: 0,
      newBalance: await getPassBalanceQuick(),
    };
  }

  const { newBalance } = await deductPass(operationType, check.passToDeduct);
  return { status: 'ok', passDeducted: check.passToDeduct, newBalance };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export type PassTransaction = {
  id: string;
  userId: string;
  delta: number;
  operationType: string;
  description: string;
  paddleTransactionId: string | null;
  createdAt: Date;
};

export async function getPassTransactions(
  limit = 20
): Promise<PassTransaction[]> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return [];

  return dbClient
    .select()
    .from(passTransaction)
    .where(eq(passTransaction.userId, sessionUser.id))
    .orderBy(desc(passTransaction.createdAt))
    .limit(limit);
}
