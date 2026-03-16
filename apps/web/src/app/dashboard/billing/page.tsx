import { getPassTransactions } from '@/lib/actions/pass';
import { syncPaddleSubscription } from '@/lib/actions/paddle-sync';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { redirect } from 'next/navigation';
import { BillingClient } from './_components/billing-client';

export const metadata = {
  title: 'Billing | Temar',
};

export default async function BillingPage() {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) redirect('/auth/login');

  // Sync subscription status from Paddle API (handles the case where
  // webhooks can't reach localhost during development).
  const [subscriptionInfo, transactions] = await Promise.all([
    syncPaddleSubscription(),
    getPassTransactions(20),
  ]);

  // Use bracket notation to prevent Next.js from inlining these at build time.
  const env = (key: string) => process.env[key] ?? '';

  const paddleConfig = {
    clientToken: env('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'),
    environment: (env('PADDLE_ENVIRONMENT') || 'sandbox') as
      | 'sandbox'
      | 'production',
    starterPriceId: env('NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID'),
    hobbyistPriceId: env('NEXT_PUBLIC_PADDLE_HOBBYIST_PRICE_ID'),
    scholarPriceId: env('NEXT_PUBLIC_PADDLE_SCHOLAR_PRICE_ID'),
    topupPacks: [
      {
        id: 'topup_50',
        pass: 50,
        price: '$2.50',
        priceId: env('NEXT_PUBLIC_PADDLE_TOPUP_50_PRICE_ID'),
      },
      {
        id: 'topup_100',
        pass: 100,
        price: '$4.99',
        priceId: env('NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID'),
      },
    ],
  };

  return (
    <BillingClient
      subscriptionInfo={subscriptionInfo}
      userId={sessionUser.id}
      transactions={transactions}
      paddleConfig={paddleConfig}
    />
  );
}
