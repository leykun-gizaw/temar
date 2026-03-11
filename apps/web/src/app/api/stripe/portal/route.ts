import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { dbClient, user, eq } from '@temar/db-client';

export async function POST(req: NextRequest) {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userRow] = await dbClient
    .select({ stripeCustomerId: user.stripeCustomerId })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!userRow?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
  }

  const origin = req.headers.get('origin') ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: userRow.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
