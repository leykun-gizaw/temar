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

  return (
    <BillingClient
      balance={balance}
      plan={plan}
      userId={sessionUser.id}
      transactions={transactions}
    />
  );
}
