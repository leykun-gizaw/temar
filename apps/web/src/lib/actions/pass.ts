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
import type { OperationType } from '@/lib/config/ai-operations';
import {
  isByokFree,
  getCostPerPassUsd,
} from '@/lib/config/ai-operations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdToPass(usd: number): number {
  return Math.floor(usd / getCostPerPassUsd());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PassBalanceInfo = {
  balance: number;
  plan: string;
};

export type CheckPassResult =
  | { status: 'ok'; passToDeduct: number; isByok: boolean }
  | { status: 'insufficient_pass'; balance: number; required: number };

// ---------------------------------------------------------------------------
// Balance queries
// ---------------------------------------------------------------------------

export async function getPassBalance(): Promise<PassBalanceInfo> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return { balance: 0, plan: 'free' };

  const [row] = await dbClient
    .select({
      balanceUsd: passBalance.balanceUsd,
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

  return { balance: usdToPass(row.balanceUsd), plan: row.plan ?? 'free' };
}

/** Lightweight balance-only fetch for real-time UI updates. */
export async function getPassBalanceQuick(): Promise<number> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return 0;

  const [row] = await dbClient
    .select({ balanceUsd: passBalance.balanceUsd })
    .from(passBalance)
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  return usdToPass(row?.balanceUsd ?? 0);
}

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

export async function creditPass(
  userId: string,
  amount: number,
  description: string,
  operationType = 'credit',
  providerTransactionId?: string
): Promise<void> {
  const usdAmount = amount * getCostPerPassUsd();
  const isTopup = operationType === 'topup';

  await dbClient.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: passBalance.id,
        balanceUsd: passBalance.balanceUsd,
        topupBalanceUsd: passBalance.topupBalanceUsd,
      })
      .from(passBalance)
      .where(eq(passBalance.userId, userId))
      .limit(1);

    if (existing) {
      await tx
        .update(passBalance)
        .set({
          balanceUsd: existing.balanceUsd + usdAmount,
          ...(isTopup && {
            topupBalanceUsd: existing.topupBalanceUsd + usdAmount,
          }),
        })
        .where(eq(passBalance.userId, userId));
    } else {
      await tx.insert(passBalance).values({
        userId,
        balanceUsd: usdAmount,
        topupBalanceUsd: isTopup ? usdAmount : 0,
      });
    }

    await tx.insert(passTransaction).values({
      userId,
      deltaUsd: usdAmount,
      operationType,
      description,
      providerTransactionId: providerTransactionId ?? null,
    });
  });
}

// ---------------------------------------------------------------------------
// Check pass availability (does NOT deduct — call deductPass after success)
// ---------------------------------------------------------------------------

export async function checkPassAvailability(
  operationType: OperationType
): Promise<CheckPassResult> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { status: 'insufficient_pass', balance: 0, required: 1 };
  }

  const [userRow] = await dbClient
    .select({
      aiApiKeyEncrypted: user.aiApiKeyEncrypted,
      useByok: user.useByok,
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

  const [balanceRow] = await dbClient
    .select({ balanceUsd: passBalance.balanceUsd })
    .from(passBalance)
    .where(eq(passBalance.userId, sessionUser.id))
    .limit(1);

  const currentBalanceUsd = balanceRow?.balanceUsd ?? 0;

  if (currentBalanceUsd <= 0) {
    return {
      status: 'insufficient_pass',
      balance: 0,
      required: 1,
    };
  }

  return { status: 'ok', passToDeduct: 0, isByok: false };
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
  providerTransactionId: string | null;
  createdAt: Date;
};

export async function getPassTransactions(
  limit = 20
): Promise<PassTransaction[]> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return [];

  const cpp = getCostPerPassUsd();

  const rows = await dbClient
    .select()
    .from(passTransaction)
    .where(eq(passTransaction.userId, sessionUser.id))
    .orderBy(desc(passTransaction.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    delta: r.deltaUsd / cpp,
  }));
}
