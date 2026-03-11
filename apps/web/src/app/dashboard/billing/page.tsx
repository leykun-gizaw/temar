import { getPassBalance, getPassTransactions } from '@/lib/actions/pass';
import { BillingClient } from './_components/billing-client';

export const metadata = {
  title: 'Billing | Temar',
};

export default async function BillingPage() {
  const [{ balance, plan }, transactions] = await Promise.all([
    getPassBalance(),
    getPassTransactions(20),
  ]);

  return (
    <BillingClient
      balance={balance}
      plan={plan}
      transactions={transactions}
    />
  );
}
