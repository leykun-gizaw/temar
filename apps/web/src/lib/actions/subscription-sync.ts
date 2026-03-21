'use server';

import { getLoggedInUser } from '@/lib/fetchers/users';
import {
  dbClient,
  user,
  passBalance,
  passTransaction,
  eq,
} from '@temar/db-client';
import {
  PLAN_PASS_ALLOCATIONS,
  getCostPerPassUsd,
} from '@/lib/config/ai-operations';
import {
  getActiveProvider,
  type SubscriptionInfo,
  type PaymentProviderKey,
} from '@temar/payment-provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdToPass(usd: number): number {
  return Math.floor(usd / getCostPerPassUsd());
}

async function ensurePassBalance(
  userId: string,
  plan: string,
  providerKey: PaymentProviderKey
): Promise<void> {
  const allocation = PLAN_PASS_ALLOCATIONS[plan] ?? 0;
  if (allocation === 0) return;

  const cpp = getCostPerPassUsd();
  const allocationUsd = allocation * cpp;

  const [existing] = await dbClient
    .select({ id: passBalance.id, balanceUsd: passBalance.balanceUsd })
    .from(passBalance)
    .where(eq(passBalance.userId, userId))
    .limit(1);

  if (existing) return; // Already has a balance row — don't overwrite

  // First-time allocation: create balance + transaction record
  const provider = getActiveProvider();
  const planMapping = provider
    .getPlanMappings()
    .find((m) => m.planKey === plan);
  const planName = planMapping?.name ?? plan;

  await dbClient.transaction(async (tx) => {
    await tx
      .insert(passBalance)
      .values({ userId, balanceUsd: allocationUsd });
    await tx.insert(passTransaction).values({
      userId,
      deltaUsd: allocationUsd,
      operationType: 'subscription',
      description: `${planName} plan — initial ${allocation} Pass allocation`,
    });
  });
}

// ---------------------------------------------------------------------------
// Main sync function — called on billing page load
// ---------------------------------------------------------------------------

export async function syncSubscription(): Promise<SubscriptionInfo> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return {
      plan: 'free',
      status: null,
      providerSubscriptionId: null,
      nextBilledAt: null,
      passResetAt: null,
      balance: 0,
    };
  }

  // Fetch current user data from DB
  const [userRow] = await dbClient
    .select({
      plan: user.plan,
      providerKey: user.providerKey,
      providerCustomerId: user.providerCustomerId,
      providerSubscriptionId: user.providerSubscriptionId,
      passResetAt: user.passResetAt,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!userRow) {
    return {
      plan: 'free',
      status: null,
      providerSubscriptionId: null,
      nextBilledAt: null,
      passResetAt: null,
      balance: 0,
    };
  }

  // If user already has a non-free plan locally, return current state
  if (userRow.plan !== 'free' && userRow.providerSubscriptionId) {
    const [balanceRow] = await dbClient
      .select({ balanceUsd: passBalance.balanceUsd })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: userRow.plan,
      status: 'active',
      providerSubscriptionId: userRow.providerSubscriptionId,
      nextBilledAt: userRow.passResetAt?.toISOString() ?? null,
      passResetAt: userRow.passResetAt?.toISOString() ?? null,
      balance: usdToPass(balanceRow?.balanceUsd ?? 0),
    };
  }

  // -----------------------------------------------------------------------
  // Sync from provider API — covers cases where webhook didn't fire
  // (e.g. localhost development)
  // -----------------------------------------------------------------------
  const providerKey = (userRow.providerKey ?? 'paddle') as PaymentProviderKey;
  const provider = getActiveProvider();

  try {
    const syncResult = await provider.syncSubscription(
      sessionUser.email,
      userRow.providerCustomerId
    );

    if (!syncResult || !syncResult.providerCustomerId) {
      // No customer found in provider — return local state
      const [balanceRow] = await dbClient
        .select({ balanceUsd: passBalance.balanceUsd })
        .from(passBalance)
        .where(eq(passBalance.userId, sessionUser.id))
        .limit(1);

      return {
        plan: userRow.plan ?? 'free',
        status: null,
        providerSubscriptionId: null,
        nextBilledAt: null,
        passResetAt: null,
        balance: usdToPass(balanceRow?.balanceUsd ?? 0),
      };
    }

    if (!syncResult.providerSubscriptionId || !syncResult.planKey) {
      // Customer exists but no active subscription
      await dbClient
        .update(user)
        .set({ providerCustomerId: syncResult.providerCustomerId })
        .where(eq(user.id, sessionUser.id));

      const [balanceRow] = await dbClient
        .select({ balanceUsd: passBalance.balanceUsd })
        .from(passBalance)
        .where(eq(passBalance.userId, sessionUser.id))
        .limit(1);

      return {
        plan: userRow.plan ?? 'free',
        status: null,
        providerSubscriptionId: null,
        nextBilledAt: null,
        passResetAt: null,
        balance: usdToPass(balanceRow?.balanceUsd ?? 0),
      };
    }

    // Update local DB with synced state
    const nextBilledAt = syncResult.nextBilledAt;

    await dbClient
      .update(user)
      .set({
        providerKey: providerKey,
        providerCustomerId: syncResult.providerCustomerId,
        plan: syncResult.planKey,
        providerSubscriptionId: syncResult.providerSubscriptionId,
        passResetAt: nextBilledAt ? new Date(nextBilledAt) : null,
      })
      .where(eq(user.id, sessionUser.id));

    // Ensure pass balance is allocated
    await ensurePassBalance(sessionUser.id, syncResult.planKey, providerKey);

    const [balanceRow] = await dbClient
      .select({ balanceUsd: passBalance.balanceUsd })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: syncResult.planKey,
      status: syncResult.status,
      providerSubscriptionId: syncResult.providerSubscriptionId,
      nextBilledAt,
      passResetAt: nextBilledAt,
      balance: usdToPass(balanceRow?.balanceUsd ?? 0),
    };
  } catch (err) {
    console.error('[subscription-sync] Failed to sync from provider API:', err);

    // Fall back to local DB state
    const [balanceRow] = await dbClient
      .select({ balanceUsd: passBalance.balanceUsd })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: userRow.plan ?? 'free',
      status: null,
      providerSubscriptionId: userRow.providerSubscriptionId,
      nextBilledAt: userRow.passResetAt?.toISOString() ?? null,
      passResetAt: userRow.passResetAt?.toISOString() ?? null,
      balance: usdToPass(balanceRow?.balanceUsd ?? 0),
    };
  }
}
