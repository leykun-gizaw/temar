import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_PLANS, type StripePlan } from '@/lib/stripe';
import { creditPass } from '@/lib/actions/pass';
import { dbClient, user, passBalance, eq } from '@temar/db-client';
import {
  PLAN_PASS_ALLOCATIONS,
  PLAN_PASS_ROLLOVER_CAPS,
} from '@/lib/config/ai-operations';
import type Stripe from 'stripe';

async function getUserIdByCustomerId(
  customerId: string
): Promise<string | null> {
  const [row] = await dbClient
    .select({ id: user.id })
    .from(user)
    .where(eq(user.stripeCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number {
  return (
    subscription.items.data[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 24 * 3600
  );
}

async function resetMonthlyPass(
  userId: string,
  plan: string,
  periodEnd: number
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
      passResetAt: new Date(periodEnd * 1000),
    })
    .where(eq(user.id, userId));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing webhook signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        if (session.mode === 'subscription') {
          const plan = session.metadata?.plan as StripePlan;
          if (!plan || !STRIPE_PLANS[plan]) break;

          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const periodEnd = getSubscriptionPeriodEnd(subscription);
          await dbClient
            .update(user)
            .set({
              stripePlan: plan,
              stripeSubscriptionId: subscription.id,
              passResetAt: new Date(periodEnd * 1000),
            })
            .where(eq(user.id, userId));

          await resetMonthlyPass(userId, plan, periodEnd);
        }

        if (session.mode === 'payment') {
          const topupPassAmount = Number(
            session.metadata?.topupPassAmount ?? 0
          );
          if (topupPassAmount > 0) {
            await creditPass(
              userId,
              topupPassAmount,
              `Top-up: ${topupPassAmount} Pass`,
              'topup',
              session.payment_intent as string
            );
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await getUserIdByCustomerId(customerId);
        if (!userId) break;

        const subDetails =
          invoice.parent?.type === 'subscription_details'
            ? (
                invoice.parent as {
                  type: 'subscription_details';
                  subscription_details: { subscription: string | null };
                }
              ).subscription_details
            : null;
        const subscriptionId = subDetails?.subscription ?? undefined;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const priceId = subscription.items.data[0]?.price.id;

        const planEntry = Object.entries(STRIPE_PLANS).find(
          ([, v]) => v.priceId === priceId
        );
        if (!planEntry) break;

        const [planKey] = planEntry;
        await resetMonthlyPass(
          userId,
          planKey,
          getSubscriptionPeriodEnd(subscription)
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await getUserIdByCustomerId(customerId);
        if (!userId) break;

        await dbClient
          .update(user)
          .set({
            stripePlan: 'free',
            stripeSubscriptionId: null,
            passResetAt: null,
          })
          .where(eq(user.id, userId));
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await getUserIdByCustomerId(customerId);
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const planEntry = Object.entries(STRIPE_PLANS).find(
          ([, v]) => v.priceId === priceId
        );
        if (!planEntry) break;

        const [planKey] = planEntry;
        await dbClient
          .update(user)
          .set({
            stripePlan: planKey,
            stripeSubscriptionId: subscription.id,
            passResetAt: new Date(
              getSubscriptionPeriodEnd(subscription) * 1000
            ),
          })
          .where(eq(user.id, userId));
        break;
      }
    }
  } catch (err) {
    console.error('[stripe webhook]', event.type, err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
