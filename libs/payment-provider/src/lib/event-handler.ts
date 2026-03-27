// ---------------------------------------------------------------------------
// Payment Provider — shared event handler
//
// Processor-agnostic billing logic. All provider adapters normalize their
// webhook events into PaymentEvent objects, then this handler applies the
// same business logic regardless of which provider sent the event.
// ---------------------------------------------------------------------------

import {
  dbClient,
  user,
  passBalance,
  passTransaction,
  eq,
  and,
} from '@temar/db-client';
import {
  PLAN_PASS_ALLOCATIONS,
  PLAN_PASS_ROLLOVER_CAPS,
} from '@temar/shared-types';
import { getCostPerPassUsd } from '@temar/pricing-service';
import type { PaymentEvent } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Look up a Temar user ID by their payment provider's customer ID.
 * Falls back to null if no match found.
 */
export async function getUserIdByProviderCustomerId(
  providerCustomerId: string
): Promise<string | null> {
  const [row] = await dbClient
    .select({ id: user.id })
    .from(user)
    .where(eq(user.providerCustomerId, providerCustomerId))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Reset monthly pass allocation with rollover cap.
 * Called on subscription activation and renewal.
 *
 * The rollover cap applies ONLY to the subscription portion of the balance.
 * Top-up passes are preserved in full — users paid for them separately.
 */
async function resetMonthlyPass(
  userId: string,
  plan: string,
  nextBilledAt: string | null
): Promise<void> {
  const cpp = getCostPerPassUsd();
  const allocation = PLAN_PASS_ALLOCATIONS[plan] ?? 0;
  const rolloverCap = PLAN_PASS_ROLLOVER_CAPS[plan] ?? 0;

  const allocationUsd = allocation * cpp;
  const rolloverCapUsd = rolloverCap * cpp;

  await dbClient.transaction(async (tx) => {
    const [balanceRow] = await tx
      .select({
        balanceUsd: passBalance.balanceUsd,
        topupBalanceUsd: passBalance.topupBalanceUsd,
      })
      .from(passBalance)
      .where(eq(passBalance.userId, userId))
      .limit(1);

    const currentBalanceUsd = balanceRow?.balanceUsd ?? 0;
    const currentTopupUsd = balanceRow?.topupBalanceUsd ?? 0;

    // Subscription portion = total minus top-up (clamped to 0)
    const currentSubUsd = Math.max(0, currentBalanceUsd - currentTopupUsd);

    // Rollover cap applies ONLY to subscription balance
    const rolledOverSubUsd = Math.min(currentSubUsd, rolloverCapUsd);
    const forfeitedUsd = currentSubUsd - rolledOverSubUsd;

    // New total = rolled-over subscription + fresh allocation + unchanged top-up
    const newBalanceUsd = rolledOverSubUsd + allocationUsd + currentTopupUsd;

    if (balanceRow) {
      await tx
        .update(passBalance)
        .set({ balanceUsd: newBalanceUsd, topupBalanceUsd: currentTopupUsd })
        .where(eq(passBalance.userId, userId));
    } else {
      await tx
        .insert(passBalance)
        .values({ userId, balanceUsd: allocationUsd, topupBalanceUsd: 0 });
    }

    // Audit trail: log forfeited passes
    if (forfeitedUsd > 0) {
      await tx.insert(passTransaction).values({
        userId,
        deltaUsd: -forfeitedUsd,
        operationType: 'rollover_forfeit',
        description: `Monthly reset: forfeited ${Math.round(forfeitedUsd / cpp)} unused subscription Pass (rollover cap: ${rolloverCap})`,
      });
    }

    // Audit trail: log monthly allocation credit
    if (allocationUsd > 0) {
      await tx.insert(passTransaction).values({
        userId,
        deltaUsd: allocationUsd,
        operationType: 'subscription',
        description: `Monthly allocation: ${allocation} Pass (${plan} plan)`,
      });
    }
  });

  await dbClient
    .update(user)
    .set({
      passResetAt: nextBilledAt ? new Date(nextBilledAt) : null,
    })
    .where(eq(user.id, userId));
}

/**
 * Debit USD from the user's balance (clamped to 0) and log a transaction.
 * When source is 'topup', the topupBalanceUsd column is also decremented
 * (e.g. a top-up refund reverses the topup portion).
 */
async function debitPass(
  userId: string,
  amountUsd: number,
  description: string,
  operationType: string,
  source: 'subscription' | 'topup',
  providerTransactionId?: string
): Promise<void> {
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
      const newBalanceUsd = Math.max(0, existing.balanceUsd - amountUsd);
      await tx
        .update(passBalance)
        .set({
          balanceUsd: newBalanceUsd,
          ...(source === 'topup' && {
            topupBalanceUsd: Math.max(
              0,
              existing.topupBalanceUsd - amountUsd
            ),
          }),
        })
        .where(eq(passBalance.userId, userId));
    }

    await tx.insert(passTransaction).values({
      userId,
      deltaUsd: -amountUsd,
      operationType,
      description,
      providerTransactionId: providerTransactionId ?? null,
    });
  });
}

/**
 * Credit pass balance. Used for top-ups and initial allocations.
 * When the credit is a top-up, the topupBalanceUsd column is also incremented
 * so rollover logic can distinguish subscription vs top-up passes.
 */
async function creditPass(
  userId: string,
  amount: number,
  description: string,
  operationType: string,
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
// Main event processor
// ---------------------------------------------------------------------------

/**
 * Process a normalized payment event. This function contains all the billing
 * business logic and is the same regardless of which provider sent the event.
 */
export async function processPaymentEvent(
  event: PaymentEvent
): Promise<void> {
  // Resolve userId if not provided (e.g. refund events where userId is empty)
  let userId = event.userId;
  if (!userId && event.providerCustomerId) {
    userId =
      (await getUserIdByProviderCustomerId(event.providerCustomerId)) ?? '';
  }
  if (!userId) {
    console.warn(
      '[payment-provider] Could not resolve userId for event:',
      event.type,
      event.providerCustomerId
    );
    return;
  }

  switch (event.type) {
    // -----------------------------------------------------------------
    // Subscription activated (first payment successful)
    // -----------------------------------------------------------------
    case 'subscription.activated': {
      if (!event.planKey) break;

      await dbClient
        .update(user)
        .set({
          providerKey: event.providerKey,
          providerCustomerId: event.providerCustomerId,
          plan: event.planKey,
          providerSubscriptionId: event.providerSubscriptionId ?? null,
          passResetAt: event.nextBilledAt
            ? new Date(event.nextBilledAt)
            : null,
        })
        .where(eq(user.id, userId));

      await resetMonthlyPass(userId, event.planKey, event.nextBilledAt ?? null);
      break;
    }

    // -----------------------------------------------------------------
    // Subscription updated (plan change, status change)
    // -----------------------------------------------------------------
    case 'subscription.updated': {
      if (!event.planKey) break;

      await dbClient
        .update(user)
        .set({
          providerKey: event.providerKey,
          providerCustomerId: event.providerCustomerId,
          plan: event.planKey,
          providerSubscriptionId: event.providerSubscriptionId ?? null,
          passResetAt: event.nextBilledAt
            ? new Date(event.nextBilledAt)
            : null,
        })
        .where(eq(user.id, userId));
      break;
    }

    // -----------------------------------------------------------------
    // Subscription canceled
    // -----------------------------------------------------------------
    case 'subscription.canceled': {
      await dbClient
        .update(user)
        .set({
          plan: 'free',
          providerSubscriptionId: null,
          passResetAt: null,
        })
        .where(eq(user.id, userId));
      break;
    }

    // -----------------------------------------------------------------
    // Subscription renewed (monthly billing cycle)
    // -----------------------------------------------------------------
    case 'subscription.renewed': {
      // Link customer ID if not already linked
      await dbClient
        .update(user)
        .set({ providerCustomerId: event.providerCustomerId })
        .where(eq(user.id, userId));

      if (event.planKey) {
        await resetMonthlyPass(
          userId,
          event.planKey,
          event.nextBilledAt ?? null
        );
      }
      break;
    }

    // -----------------------------------------------------------------
    // One-time top-up completed
    // -----------------------------------------------------------------
    case 'topup.completed': {
      // Link customer ID if not already linked
      await dbClient
        .update(user)
        .set({ providerCustomerId: event.providerCustomerId })
        .where(eq(user.id, userId));

      const topupAmount = event.topupPassAmount ?? 0;
      if (topupAmount > 0) {
        await creditPass(
          userId,
          topupAmount,
          `Top-up: ${topupAmount} Pass`,
          'topup',
          event.providerTransactionId
        );
      }
      break;
    }

    // -----------------------------------------------------------------
    // Subscription refund — downgrade + debit
    // -----------------------------------------------------------------
    case 'refund.subscription': {
      await dbClient
        .update(user)
        .set({
          plan: 'free',
          providerSubscriptionId: null,
          passResetAt: null,
        })
        .where(eq(user.id, userId));

      // Find and reverse the original subscription credit
      if (event.providerTransactionId) {
        const [originalCredit] = await dbClient
          .select({ deltaUsd: passTransaction.deltaUsd })
          .from(passTransaction)
          .where(
            and(
              eq(passTransaction.userId, userId),
              eq(
                passTransaction.providerTransactionId,
                event.providerTransactionId
              ),
              eq(passTransaction.operationType, 'subscription')
            )
          )
          .limit(1);

        if (originalCredit && originalCredit.deltaUsd > 0) {
          await debitPass(
            userId,
            originalCredit.deltaUsd,
            `Refund: $${originalCredit.deltaUsd.toFixed(2)} (subscription)`,
            'refund',
            'subscription',
            event.providerTransactionId
          );
        }
      }
      break;
    }

    // -----------------------------------------------------------------
    // Top-up refund — debit the credited amount
    // -----------------------------------------------------------------
    case 'refund.topup': {
      if (event.providerTransactionId) {
        const [originalCredit] = await dbClient
          .select({ deltaUsd: passTransaction.deltaUsd })
          .from(passTransaction)
          .where(
            and(
              eq(passTransaction.userId, userId),
              eq(
                passTransaction.providerTransactionId,
                event.providerTransactionId
              ),
              eq(passTransaction.operationType, 'topup')
            )
          )
          .limit(1);

        if (originalCredit && originalCredit.deltaUsd > 0) {
          await debitPass(
            userId,
            originalCredit.deltaUsd,
            `Refund: $${originalCredit.deltaUsd.toFixed(2)} (top-up)`,
            'refund',
            'topup',
            event.providerTransactionId
          );
        }
      }
      break;
    }
  }
}
