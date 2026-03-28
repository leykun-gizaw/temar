'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, cn } from '@temar/ui';
import {
  Coins,
  CreditCard,
  Zap,
  ExternalLink,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import type { PassTransaction } from '@/lib/actions/pass';
import type { SubscriptionInfo, CheckoutConfig } from '@temar/payment-provider';
import { useCheckout } from '@/hooks/use-checkout';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  hobbyist: 'Hobbyist',
  scholar: 'Scholar',
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    'BYOK — use your own AI API key',
    'Spaced repetition (FSRS)',
    'Unlimited topics & notes',
  ],
  starter: [
    '100 Pass per month',
    'Managed AI — no API key required',
    'Economy & Standard model tiers',
  ],
  hobbyist: [
    '200 Pass per month',
    'All Starter features included',
    'Economy & Standard model tiers',
  ],
  scholar: [
    '300 Pass per month',
    'Access to Premium model tier',
    'Priority support',
  ],
};

const PLAN_PASS_MONTHLY: Record<string, number> = {
  free: 0,
  starter: 100,
  hobbyist: 200,
  scholar: 300,
};

interface BillingClientProps {
  subscriptionInfo: SubscriptionInfo;
  userId: string;
  transactions: PassTransaction[];
  checkoutConfig: CheckoutConfig;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BillingClient({
  subscriptionInfo,
  userId,
  transactions,
  checkoutConfig,
}: BillingClientProps) {
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const { ready: checkoutReady, loading, openCheckout } = useCheckout(
    checkoutConfig,
    userId
  );

  const { plan, status, nextBilledAt, balance } = subscriptionInfo;
  const hasActiveSub = plan !== 'free' && !!status;
  const planFeatures = PLAN_FEATURES[plan] ?? [];
  const passPerMonth = PLAN_PASS_MONTHLY[plan] ?? 0;
  const usagePercent =
    passPerMonth > 0 ? Math.min(100, (balance / passPerMonth) * 100) : 0;

  const manageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/manage', { method: 'POST' });
      const data = (await res.json()) as {
        updatePaymentMethod?: string | null;
        cancel?: string | null;
      };
      if (data.updatePaymentMethod) {
        window.open(data.updatePaymentMethod, '_blank');
      } else if (data.cancel) {
        window.open(data.cancel, '_blank');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="w-full p-8">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Billing &amp; Usage
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Manage your subscription and Pass balance.
        </p>
      </header>

      {/* Two-column layout: Left (plan/balance/topup) + Right (transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 items-start">
        {/* Left column */}
        <div className="space-y-8">
          {/* Subscription + Balance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Plan Card */}
            <section className="bg-muted/50 rounded-[2rem] p-9 flex flex-col justify-between relative overflow-hidden shadow-md">
              {hasActiveSub && (
                <div className="absolute top-6 right-6">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    Active Plan
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Your Subscription
                </span>
                <h2 className="text-4xl font-bold text-primary mb-5">
                  {PLAN_LABELS[plan] ?? plan}
                </h2>
                <ul className="space-y-2.5 mb-8">
                  {planFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[0.9rem]"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {hasActiveSub ? (
                <div className="space-y-3">
                  {nextBilledAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span>
                        Next renewal:{' '}
                        <span className="font-medium text-foreground">
                          {formatDate(nextBilledAt)}
                        </span>
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={manageSubscription}
                    disabled={portalLoading}
                    className="w-full rounded-full gap-2 shadow-lg shadow-primary/25"
                  >
                    <CreditCard className="h-4 w-4" />
                    {portalLoading ? 'Opening…' : 'Manage Subscription'}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.entries(checkoutConfig.plans).map(
                    ([key, { priceId }]) => {
                      const label = PLAN_LABELS[key] ?? key;
                      const prices: Record<string, string> = {
                        starter: '$4.99/mo',
                        hobbyist: '$9.99/mo',
                        scholar: '$14.99/mo',
                      };
                      const isFirst = key === 'starter';
                      return (
                        <Button
                          key={key}
                          variant={isFirst ? 'default' : 'secondary'}
                          className={cn(
                            'w-full rounded-full',
                            isFirst && 'shadow-lg shadow-primary/25'
                          )}
                          onClick={() =>
                            openCheckout(priceId, undefined, key)
                          }
                          disabled={!checkoutReady || !!loading}
                        >
                          {loading === key
                            ? 'Opening…'
                            : `${label} — ${prices[key] ?? ''}`}
                        </Button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* Pass Balance Card */}
            <section className="bg-muted/40 rounded-[2rem] p-9 flex flex-col justify-center items-center text-center shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                Pass Balance
              </span>
              <div className="text-7xl font-black tracking-tighter">
                {balance}
              </div>
              <span className="text-base font-medium text-primary/80">
                Pass remaining
              </span>

              {passPerMonth > 0 && (
                <div className="w-full h-3 bg-background/60 rounded-full overflow-hidden mt-6 mb-3">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}

              <p className="text-sm text-muted-foreground max-w-[240px] mt-3">
                {hasActiveSub
                  ? 'Used for AI-powered question generation and answer analysis.'
                  : 'Purchase a plan or top-up pack to get Pass.'}
              </p>

              {hasActiveSub && nextBilledAt && (
                <p className="text-xs text-muted-foreground/70 mt-3">
                  Renews on {formatDate(nextBilledAt)}
                </p>
              )}
            </section>
          </div>

          {/* Top-up Packs */}
          <section>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Top-up Packs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {checkoutConfig.topupPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-muted/40 rounded-[2rem] p-6 flex justify-between items-center group hover:bg-muted/60 transition-colors shadow-md"
                >
                  <div>
                    <h4 className="font-bold text-lg">{pack.pass} Pass</h4>
                    <p className="text-sm text-muted-foreground">
                      One-time purchase
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="rounded-full font-bold px-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    disabled={!checkoutReady || !!loading}
                    onClick={() =>
                      openCheckout(
                        pack.priceId,
                        { topupPassAmount: String(pack.pass) },
                        pack.id
                      )
                    }
                  >
                    {loading === pack.id ? 'Opening…' : pack.price}
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Top-up Passes expire after 12 months. Checkout powered by your
              payment provider.
            </p>
          </section>
        </div>

        {/* Right column — Transaction History */}
        <section>
          <h3 className="text-xl font-bold mb-6">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="bg-muted/40 rounded-[2rem] p-8 text-center shadow-md">
              <Coins className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet.
              </p>
            </div>
          ) : (
            <div className="bg-muted/40 rounded-[2rem] overflow-hidden shadow-md">
              <table className="w-full text-[0.9rem]">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="px-5 py-4 font-bold text-muted-foreground text-left">
                      Description
                    </th>
                    <th className="px-5 py-4 font-bold text-muted-foreground text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-background/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium block">
                          {tx.description}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'px-5 py-4 text-right font-bold tabular-nums whitespace-nowrap',
                          tx.delta > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {tx.delta > 0 ? '+' : ''}
                        {tx.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 gap-2 text-xs rounded-xl"
            onClick={() => router.push('/pricing')}
          >
            View pricing &amp; plans
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </section>
      </div>
    </div>
  );
}
