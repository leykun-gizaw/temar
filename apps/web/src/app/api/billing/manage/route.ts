import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { dbClient, user, eq } from '@temar/db-client';
import {
  getProvider,
  type PaymentProviderKey,
} from '@temar/payment-provider';

export async function POST() {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userRow] = await dbClient
    .select({
      providerKey: user.providerKey,
      providerSubscriptionId: user.providerSubscriptionId,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!userRow?.providerSubscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 400 }
    );
  }

  try {
    const providerKey = (userRow.providerKey ?? 'paddle') as PaymentProviderKey;
    const provider = getProvider(providerKey);
    const urls = await provider.getManagementUrls(
      userRow.providerSubscriptionId
    );

    return NextResponse.json({
      updatePaymentMethod: urls.updatePaymentMethod,
      cancel: urls.cancel,
    });
  } catch (err) {
    console.error('[billing/manage]', err);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
