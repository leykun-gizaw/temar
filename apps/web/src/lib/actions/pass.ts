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
  getPassCost,
  isByokFree,
  estimateInputTokens,
  estimatedPassCostFromTokens,
  OPERATION_CONFIGS,
} from '@/lib/config/ai-operations';

export type PassBalanceInfo = {
  balance: number;
  plan: string;
};

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

export type DeductPassResult =
  | { status: 'ok'; passDeducted: number }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | {
      status: 'consent_required';
      estimatedPassCost: number;
      basePassCost: number;
    };

export async function checkAndDeductPass(
  operationType: OperationType,
  modelId: string,
  inputText: string,
  provider: 'google' | 'openai' | 'anthropic',
  consentedPassCost?: number
): Promise<DeductPassResult> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { status: 'insufficient_pass', balance: 0, required: 1 };
  }

  const [userRow] = await dbClient
    .select({
      aiApiKeyEncrypted: user.aiApiKeyEncrypted,
      plan: user.plan,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  const hasApiKey = !!userRow?.aiApiKeyEncrypted;
  const byokFree = isByokFree(operationType, hasApiKey);

  if (byokFree) {
    return { status: 'ok', passDeducted: 0 };
  }

  const basePassCost = getPassCost(operationType, modelId);
  const inputTokens = estimateInputTokens(inputText, provider);
  const estimatedCost = estimatedPassCostFromTokens(
    inputTokens,
    operationType,
    modelId
  );

  const requiredCost = consentedPassCost ?? estimatedCost;

  if (estimatedCost > basePassCost && !consentedPassCost) {
    return {
      status: 'consent_required',
      estimatedPassCost: estimatedCost,
      basePassCost,
    };
  }

  const [balanceRow] = await dbClient
    .select({ id: passBalance.id, balance: passBalance.balance })
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

  await dbClient.transaction(async (tx) => {
    await tx
      .update(passBalance)
      .set({ balance: currentBalance - requiredCost })
      .where(eq(passBalance.userId, sessionUser.id));

    await tx.insert(passTransaction).values({
      userId: sessionUser.id,
      delta: -requiredCost,
      operationType,
      description: `Used for ${
        OPERATION_CONFIGS[operationType]?.label ?? operationType
      }`,
    });
  });

  revalidatePath('/dashboard/billing');
  return { status: 'ok', passDeducted: requiredCost };
}

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
