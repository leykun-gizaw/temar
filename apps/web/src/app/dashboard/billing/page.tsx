import { getPassBalance, getPassTransactions } from '@/lib/actions/pass';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { redirect } from 'next/navigation';
import { BillingClient } from './_components/billing-client';

export const metadata = {
  title: 'Billing | Temar',
};

export default async function BillingPage() {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) redirect('/auth/login');

  const [{ balance, plan }, transactions] = await Promise.all([
    getPassBalance(),
    getPassTransactions(20),
  ]);

  const paddleConfig = {
    clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '',
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? 'sandbox',
    starterPriceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID ?? '',
    scholarPriceId: process.env.NEXT_PUBLIC_PADDLE_SCHOLAR_PRICE_ID ?? '',
    topupPacks: [
      {
        id: 'topup_100',
        pass: 100,
        price: '$3.99',
        priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID ?? '',
      },
      {
        id: 'topup_300',
        pass: 300,
        price: '$9.99',
        priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_300_PRICE_ID ?? '',
        best: true,
      },
      {
        id: 'topup_600',
        pass: 600,
        price: '$17.99',
        priceId: process.env.NEXT_PUBLIC_PADDLE_TOPUP_600_PRICE_ID ?? '',
      },
    ],
  };

  return (
    <BillingClient
      balance={balance}
      plan={plan}
      userId={sessionUser.id}
      transactions={transactions}
      paddleConfig={paddleConfig}
    />
  );
}
