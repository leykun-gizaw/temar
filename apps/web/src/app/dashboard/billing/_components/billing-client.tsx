'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, CreditCard, ArrowUpCircle, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PassTransaction } from '@/lib/actions/pass';

const TOPUP_PACKS = [
  { id: 'topup_100', pass: 100, price: '$3.99', priceId: process.env.NEXT_PUBLIC_STRIPE_TOPUP_100_PRICE_ID ?? '' },
  { id: 'topup_300', pass: 300, price: '$9.99', priceId: process.env.NEXT_PUBLIC_STRIPE_TOPUP_300_PRICE_ID ?? '', best: true },
  { id: 'topup_600', pass: 600, price: '$17.99', priceId: process.env.NEXT_PUBLIC_STRIPE_TOPUP_600_PRICE_ID ?? '' },
];

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  scholar: 'Scholar',
};

const PLAN_BADGE_VARIANT: Record<string, string> = {
  free: 'secondary',
  starter: 'default',
  scholar: 'default',
};

interface BillingClientProps {
  balance: number;
  plan: string;
  transactions: PassTransaction[];
}

export function BillingClient({ balance, plan, transactions }: BillingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (type: 'subscription' | 'topup', priceId: string, packId?: string) => {
    setLoading(packId ?? type);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, priceId }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  const openPortal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing &amp; Pass</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and Pass balance.
        </p>
      </div>

      {/* Balance card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Pass Balance
            </span>
            <Badge variant={PLAN_BADGE_VARIANT[plan] as 'default' | 'secondary'} className="capitalize">
              {PLAN_LABELS[plan] ?? plan}
            </Badge>
          </CardTitle>
          <CardDescription>
            Pass is used for AI operations. Renews monthly with your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tabular-nums">{balance}</span>
            <span className="mb-1 text-lg text-muted-foreground">Pass</span>
          </div>
          {plan !== 'free' && (
            <Button
              variant="outline"
              size="sm"
              onClick={openPortal}
              disabled={loading === 'portal'}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {loading === 'portal' ? 'Opening…' : 'Manage subscription'}
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Button>
          )}
          {plan === 'free' && (
            <div className="flex gap-3 flex-wrap">
              <Button
                size="sm"
                onClick={() => startCheckout('subscription', process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? '', 'starter')}
                disabled={!!loading}
              >
                Upgrade to Starter — $9.99/mo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startCheckout('subscription', process.env.NEXT_PUBLIC_STRIPE_SCHOLAR_PRICE_ID ?? '', 'scholar')}
                disabled={!!loading}
              >
                Go Scholar — $24.99/mo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-up packs */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          Top-up Packs
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TOPUP_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={cn(
                'relative flex flex-col items-center text-center py-5 px-4',
                pack.best && 'ring-2 ring-primary/50'
              )}
            >
              {pack.best && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  <Zap className="h-3 w-3" /> Best value
                </span>
              )}
              <Coins className="h-7 w-7 text-primary mb-2" />
              <p className="text-2xl font-bold">{pack.pass}</p>
              <p className="text-xs text-muted-foreground mb-1">Pass</p>
              <p className="text-base font-semibold mb-4">{pack.price}</p>
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                disabled={!!loading}
                onClick={() => startCheckout('topup', pack.priceId, pack.id)}
              >
                {loading === pack.id ? 'Redirecting…' : 'Buy'}
              </Button>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Purchased Pass never expires. Redirects to Stripe Checkout.
        </p>
      </div>

      <Separator />

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{tx.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>
                <span
                  className={cn(
                    'tabular-nums font-semibold text-sm',
                    tx.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}
                >
                  {tx.delta > 0 ? '+' : ''}{tx.delta}
                </span>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 gap-2 text-xs"
          onClick={() => router.push('/pricing')}
        >
          View pricing &amp; plans
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
