import { getPassTransactions } from '@/lib/actions/pass';
import { syncSubscription } from '@/lib/actions/subscription-sync';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { getActiveProvider } from '@temar/payment-provider';
import { redirect } from 'next/navigation';
import { BillingClient } from './_components/billing-client';

export const metadata = {
  title: 'Billing | Temar',
};

export default async function BillingPage() {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) redirect('/auth/login');

  // Sync subscription status from provider API (handles the case where
  // webhooks can't reach localhost during development).
  const [subscriptionInfo, transactions] = await Promise.all([
    syncSubscription(),
    getPassTransactions(20),
  ]);

  const checkoutConfig = getActiveProvider().getCheckoutConfig();

  return (
    <BillingClient
      subscriptionInfo={subscriptionInfo}
      userId={sessionUser.id}
      transactions={transactions}
      checkoutConfig={checkoutConfig}
    />
  );
}
