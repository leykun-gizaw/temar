import { NextResponse } from 'next/server';
import { getPaddleInstance } from '@/lib/paddle';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { dbClient, user, eq } from '@temar/db-client';

export async function POST() {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userRow] = await dbClient
    .select({ paddleSubscriptionId: user.paddleSubscriptionId })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!userRow?.paddleSubscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 400 }
    );
  }

  try {
    const paddle = getPaddleInstance();
    const subscription = await paddle.subscriptions.get(
      userRow.paddleSubscriptionId
    );

    const sub = subscription as unknown as {
      managementUrls?: {
        updatePaymentMethod?: string;
        cancel?: string;
      };
    };

    return NextResponse.json({
      updatePaymentMethod: sub.managementUrls?.updatePaymentMethod ?? null,
      cancel: sub.managementUrls?.cancel ?? null,
    });
  } catch (err) {
    console.error('[paddle manage]', err);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
