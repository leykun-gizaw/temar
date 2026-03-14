'use server';

import { getPaddleInstance, PADDLE_PLANS } from '@/lib/paddle';
import { getLoggedInUser } from '@/lib/fetchers/users';
import {
  dbClient,
  user,
  passBalance,
  passTransaction,
  eq,
} from '@temar/db-client';
import { PLAN_PASS_ALLOCATIONS } from '@/lib/config/ai-operations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionInfo {
  plan: string;
  status: string | null; // 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled' | null
  paddleSubscriptionId: string | null;
  nextBilledAt: string | null;
  passResetAt: string | null;
  balance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function planKeyFromPriceId(priceId: string): string | null {
  const entry = Object.entries(PADDLE_PLANS).find(
    ([, v]) => v.priceId === priceId
  );
  return entry ? entry[0] : null;
}

async function ensurePassBalance(
  userId: string,
  plan: string,
  nextBilledAt: string | null
): Promise<void> {
  const allocation = PLAN_PASS_ALLOCATIONS[plan] ?? 0;
  if (allocation === 0) return;

  const [existing] = await dbClient
    .select({ id: passBalance.id, balance: passBalance.balance })
    .from(passBalance)
    .where(eq(passBalance.userId, userId))
    .limit(1);

  if (existing) return; // Already has a balance row — don't overwrite

  // First-time allocation: create balance + transaction record
  await dbClient.transaction(async (tx) => {
    await tx.insert(passBalance).values({ userId, balance: allocation });
    await tx.insert(passTransaction).values({
      userId,
      delta: allocation,
      operationType: 'subscription',
      description: `${
        PADDLE_PLANS[plan as keyof typeof PADDLE_PLANS]?.name ?? plan
      } plan — initial ${allocation} Pass allocation`,
    });
  });
}

// ---------------------------------------------------------------------------
// Main sync function — called on billing page load
// ---------------------------------------------------------------------------

export async function syncPaddleSubscription(): Promise<SubscriptionInfo> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return {
      plan: 'free',
      status: null,
      paddleSubscriptionId: null,
      nextBilledAt: null,
      passResetAt: null,
      balance: 0,
    };
  }

  // Fetch current user data from DB
  const [userRow] = await dbClient
    .select({
      plan: user.plan,
      paddleCustomerId: user.paddleCustomerId,
      paddleSubscriptionId: user.paddleSubscriptionId,
      passResetAt: user.passResetAt,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!userRow) {
    return {
      plan: 'free',
      status: null,
      paddleSubscriptionId: null,
      nextBilledAt: null,
      passResetAt: null,
      balance: 0,
    };
  }

  // If user already has a non-free plan locally, just return current state
  // (webhook already handled it, or a previous sync did)
  if (userRow.plan !== 'free' && userRow.paddleSubscriptionId) {
    const [balanceRow] = await dbClient
      .select({ balance: passBalance.balance })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: userRow.plan,
      status: 'active',
      paddleSubscriptionId: userRow.paddleSubscriptionId,
      nextBilledAt: userRow.passResetAt?.toISOString() ?? null,
      passResetAt: userRow.passResetAt?.toISOString() ?? null,
      balance: balanceRow?.balance ?? 0,
    };
  }

  // -----------------------------------------------------------------------
  // Sync from Paddle API — covers cases where webhook didn't fire
  // (e.g. localhost development)
  // -----------------------------------------------------------------------
  const paddle = getPaddleInstance();

  try {
    // Step 1: Find Paddle customer by email
    let customerId = userRow.paddleCustomerId;

    if (!customerId) {
      const customerCollection = paddle.customers.list({
        email: [sessionUser.email],
      });

      for await (const customer of customerCollection) {
        customerId = customer.id;
        break; // Take the first matching customer
      }

      if (!customerId) {
        // No Paddle customer found — user hasn't purchased anything
        const [balanceRow] = await dbClient
          .select({ balance: passBalance.balance })
          .from(passBalance)
          .where(eq(passBalance.userId, sessionUser.id))
          .limit(1);

        return {
          plan: userRow.plan ?? 'free',
          status: null,
          paddleSubscriptionId: null,
          nextBilledAt: null,
          passResetAt: null,
          balance: balanceRow?.balance ?? 0,
        };
      }
    }

    // Step 2: Find active subscription
    const subCollection = paddle.subscriptions.list({
      customerId: [customerId],
      status: ['active', 'trialing', 'past_due'],
    });

    type ActiveSub = {
      id: string;
      status: string;
      items: { price: { id: string } }[];
      nextBilledAt: string | null;
    };

    let activeSub: ActiveSub | null = null;

    for await (const sub of subCollection) {
      activeSub = sub as unknown as ActiveSub;
      break; // Take the first active subscription
    }

    if (!activeSub) {
      // Customer exists but no active subscription
      await dbClient
        .update(user)
        .set({ paddleCustomerId: customerId })
        .where(eq(user.id, sessionUser.id));

      const [balanceRow] = await dbClient
        .select({ balance: passBalance.balance })
        .from(passBalance)
        .where(eq(passBalance.userId, sessionUser.id))
        .limit(1);

      return {
        plan: userRow.plan ?? 'free',
        status: null,
        paddleSubscriptionId: null,
        nextBilledAt: null,
        passResetAt: null,
        balance: balanceRow?.balance ?? 0,
      };
    }

    // Step 3: Determine plan from subscription price
    const priceId = activeSub.items?.[0]?.price?.id;
    const planKey = priceId ? planKeyFromPriceId(priceId) : null;

    if (!planKey) {
      console.warn(
        '[paddle-sync] Could not determine plan from priceId:',
        priceId
      );
      return {
        plan: userRow.plan ?? 'free',
        status: activeSub.status,
        paddleSubscriptionId: activeSub.id,
        nextBilledAt: activeSub.nextBilledAt,
        passResetAt: null,
        balance: 0,
      };
    }

    // Step 4: Update local DB
    const nextBilledAt = activeSub.nextBilledAt;

    await dbClient
      .update(user)
      .set({
        paddleCustomerId: customerId,
        plan: planKey,
        paddleSubscriptionId: activeSub.id,
        passResetAt: nextBilledAt ? new Date(nextBilledAt) : null,
      })
      .where(eq(user.id, sessionUser.id));

    // Step 5: Ensure pass balance is allocated
    await ensurePassBalance(sessionUser.id, planKey, nextBilledAt);

    const [balanceRow] = await dbClient
      .select({ balance: passBalance.balance })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: planKey,
      status: activeSub.status,
      paddleSubscriptionId: activeSub.id,
      nextBilledAt,
      passResetAt: nextBilledAt,
      balance: balanceRow?.balance ?? 0,
    };
  } catch (err) {
    console.error('[paddle-sync] Failed to sync from Paddle API:', err);

    // Fall back to local DB state
    const [balanceRow] = await dbClient
      .select({ balance: passBalance.balance })
      .from(passBalance)
      .where(eq(passBalance.userId, sessionUser.id))
      .limit(1);

    return {
      plan: userRow.plan ?? 'free',
      status: null,
      paddleSubscriptionId: userRow.paddleSubscriptionId,
      nextBilledAt: userRow.passResetAt?.toISOString() ?? null,
      passResetAt: userRow.passResetAt?.toISOString() ?? null,
      balance: balanceRow?.balance ?? 0,
    };
  }
}
