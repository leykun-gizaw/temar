import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS, type StripePlan } from '@/lib/stripe';
import { TOPUP_PACKS } from '@/lib/config/ai-operations';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { dbClient, user, eq } from '@temar/db-client';

export async function POST(req: NextRequest) {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, plan, topupPassAmount } = body as {
    type: 'subscription' | 'topup';
    plan?: StripePlan;
    topupPassAmount?: number;
  };

  const [userRow] = await dbClient
    .select({ stripeCustomerId: user.stripeCustomerId, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  let customerId = userRow?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRow?.email,
      name: userRow?.name ?? undefined,
      metadata: { userId: sessionUser.id },
    });
    customerId = customer.id;
    await dbClient
      .update(user)
      .set({ stripeCustomerId: customerId })
      .where(eq(user.id, sessionUser.id));
  }

  const origin = req.headers.get('origin') ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

  if (type === 'subscription' && plan && STRIPE_PLANS[plan]) {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PLANS[plan].priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId: sessionUser.id, plan },
    });
    return NextResponse.json({ url: session.url });
  }

  if (type === 'topup' && topupPassAmount) {
    const pack = TOPUP_PACKS.find((p) => p.passAmount === topupPassAmount);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid top-up pack' }, { status: 400 });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?topup=1`,
      cancel_url: `${origin}/dashboard/billing`,
      metadata: { userId: sessionUser.id, topupPassAmount: String(topupPassAmount) },
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
