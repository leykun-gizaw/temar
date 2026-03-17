import { NextRequest, NextResponse } from 'next/server';
import { getPaddleInstance, PADDLE_PLANS } from '@/lib/paddle';
import { creditPass } from '@/lib/actions/pass';
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
} from '@/lib/config/ai-operations';
import { EventName, type EventEntity } from '@paddle/paddle-node-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserIdByPaddleCustomerId(
  customerId: string
): Promise<string | null> {
  const [row] = await dbClient
    .select({ id: user.id })
    .from(user)
    .where(eq(user.paddleCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}

async function resetMonthlyPass(
  userId: string,
  plan: string,
  nextBilledAt: string | null
): Promise<void> {
  const allocation = PLAN_PASS_ALLOCATIONS[plan] ?? 0;
  const rolloverCap = PLAN_PASS_ROLLOVER_CAPS[plan] ?? 0;

  const [balanceRow] = await dbClient
    .select({ balance: passBalance.balance })
    .from(passBalance)
    .where(eq(passBalance.userId, userId))
    .limit(1);

  const currentBalance = balanceRow?.balance ?? 0;
  const rolledOver = Math.min(currentBalance, rolloverCap);
  const newBalance = rolledOver + allocation;

  if (balanceRow) {
    await dbClient
      .update(passBalance)
      .set({ balance: newBalance })
      .where(eq(passBalance.userId, userId));
  } else {
    await dbClient.insert(passBalance).values({ userId, balance: newBalance });
  }

  await dbClient
    .update(user)
    .set({
      passResetAt: nextBilledAt ? new Date(nextBilledAt) : null,
    })
    .where(eq(user.id, userId));
}

function planKeyFromPriceId(priceId: string): string | null {
  const entry = Object.entries(PADDLE_PLANS).find(
    ([, v]) => v.priceId === priceId
  );
  return entry ? entry[0] : null;
}

/**
 * Debit passes from the user's balance (clamped to 0) and log a transaction.
 */
async function debitPass(
  userId: string,
  amount: number,
  description: string,
  operationType: string,
  paddleTransactionId?: string
): Promise<void> {
  await dbClient.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: passBalance.id, balance: passBalance.balance })
      .from(passBalance)
      .where(eq(passBalance.userId, userId))
      .limit(1);

    if (existing) {
      const newBalance = Math.max(0, existing.balance - amount);
      await tx
        .update(passBalance)
        .set({ balance: newBalance })
        .where(eq(passBalance.userId, userId));
    }
    // If no balance row exists, nothing to debit

    await tx.insert(passTransaction).values({
      userId,
      delta: -amount,
      operationType,
      description,
      paddleTransactionId: paddleTransactionId ?? null,
    });
  });
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('paddle-signature');

  if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing webhook signature or secret' },
      { status: 400 }
    );
  }

  const paddle = getPaddleInstance();

  let event: EventEntity;
  try {
    event = paddle.webhooks.unmarshal(
      body,
      process.env.PADDLE_WEBHOOK_SECRET,
      signature
    ) as EventEntity;
  } catch (err) {
    console.error('[paddle webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.eventType) {
      // -----------------------------------------------------------------
      // Subscription activated (first payment successful)
      // -----------------------------------------------------------------
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated: {
        const sub = event.data as {
          id: string;
          customerId: string;
          status: string;
          items: { price: { id: string } }[];
          nextBilledAt: string | null;
          customData?: { userId?: string };
        };

        const priceId = sub.items?.[0]?.price?.id;
        const planKey = priceId ? planKeyFromPriceId(priceId) : null;
        const userId =
          sub.customData?.userId ??
          (await getUserIdByPaddleCustomerId(sub.customerId));

        if (!userId || !planKey) break;

        // Link Paddle customer if not linked
        await dbClient
          .update(user)
          .set({
            paddleCustomerId: sub.customerId,
            plan: planKey,
            paddleSubscriptionId: sub.id,
            passResetAt: sub.nextBilledAt ? new Date(sub.nextBilledAt) : null,
          })
          .where(eq(user.id, userId));

        // Only allocate on activation (first time)
        if (event.eventType === EventName.SubscriptionActivated) {
          await resetMonthlyPass(userId, planKey, sub.nextBilledAt);
        }
        break;
      }

      // -----------------------------------------------------------------
      // Subscription canceled
      // -----------------------------------------------------------------
      case EventName.SubscriptionCanceled: {
        const sub = event.data as {
          customerId: string;
        };
        const userId = await getUserIdByPaddleCustomerId(sub.customerId);
        if (!userId) break;

        await dbClient
          .update(user)
          .set({
            plan: 'free',
            paddleSubscriptionId: null,
            passResetAt: null,
          })
          .where(eq(user.id, userId));
        break;
      }

      // -----------------------------------------------------------------
      // Transaction completed — handles renewals and one-time top-ups
      // -----------------------------------------------------------------
      case EventName.TransactionCompleted: {
        const txn = event.data as {
          id: string;
          customerId: string;
          subscriptionId: string | null;
          items: { price: { id: string; type: string } }[];
          customData?: { userId?: string; topupPassAmount?: string };
        };

        const userId =
          txn.customData?.userId ??
          (await getUserIdByPaddleCustomerId(txn.customerId));
        if (!userId) break;

        // Link customer ID if missing
        await dbClient
          .update(user)
          .set({ paddleCustomerId: txn.customerId })
          .where(eq(user.id, userId));

        // One-time top-up (no subscription)
        if (!txn.subscriptionId && txn.customData?.topupPassAmount) {
          const topupAmount = Number(txn.customData.topupPassAmount);
          if (topupAmount > 0) {
            await creditPass(
              userId,
              topupAmount,
              `Top-up: ${topupAmount} Pass`,
              'topup',
              txn.id
            );
          }
          break;
        }

        // Subscription renewal — reset monthly pass allocation
        if (txn.subscriptionId) {
          const priceId = txn.items?.[0]?.price?.id;
          const planKey = priceId ? planKeyFromPriceId(priceId) : null;
          if (planKey) {
            // Fetch subscription to get nextBilledAt
            const subData = await paddle.subscriptions.get(txn.subscriptionId);
            const nextBilledAt =
              (subData as { nextBilledAt?: string }).nextBilledAt ?? null;
            await resetMonthlyPass(userId, planKey, nextBilledAt);
          }
        }
        break;
      }

      // -----------------------------------------------------------------
      // Adjustment created — handles refunds and chargebacks
      // -----------------------------------------------------------------
      case EventName.AdjustmentCreated: {
        const adj = event.data as {
          id: string;
          action: string;
          transactionId: string;
          subscriptionId: string | null;
          customerId: string;
          status: string;
        };

        // Only act on approved refunds/chargebacks
        if (adj.status !== 'approved') break;
        if (adj.action !== 'refund' && adj.action !== 'chargeback') break;

        const userId = await getUserIdByPaddleCustomerId(adj.customerId);
        if (!userId) break;

        if (adj.subscriptionId) {
          // ---------------------------------------------------------------
          // Subscription refund → downgrade to free tier
          // ---------------------------------------------------------------
          await dbClient
            .update(user)
            .set({
              plan: 'free',
              paddleSubscriptionId: null,
              passResetAt: null,
            })
            .where(eq(user.id, userId));

          // Debit the subscription allocation that was credited
          const [originalCredit] = await dbClient
            .select({ delta: passTransaction.delta })
            .from(passTransaction)
            .where(
              and(
                eq(passTransaction.userId, userId),
                eq(passTransaction.paddleTransactionId, adj.transactionId),
                eq(passTransaction.operationType, 'subscription')
              )
            )
            .limit(1);

          if (originalCredit && originalCredit.delta > 0) {
            await debitPass(
              userId,
              originalCredit.delta,
              `Refund: ${originalCredit.delta} Pass (subscription)`,
              'refund',
              adj.transactionId
            );
          }
        } else {
          // ---------------------------------------------------------------
          // Top-up refund → debit the credited passes
          // ---------------------------------------------------------------
          const [originalCredit] = await dbClient
            .select({ delta: passTransaction.delta })
            .from(passTransaction)
            .where(
              and(
                eq(passTransaction.userId, userId),
                eq(passTransaction.paddleTransactionId, adj.transactionId),
                eq(passTransaction.operationType, 'topup')
              )
            )
            .limit(1);

          if (originalCredit && originalCredit.delta > 0) {
            await debitPass(
              userId,
              originalCredit.delta,
              `Refund: ${originalCredit.delta} Pass (top-up)`,
              'refund',
              adj.transactionId
            );
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[paddle webhook]', event.eventType, err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
