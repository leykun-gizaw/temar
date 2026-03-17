'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPassBalance } from '@/lib/actions/pass';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Custom event name for real-time pass balance updates.
 * Dispatch this event anywhere to trigger a balance refresh:
 *   window.dispatchEvent(new CustomEvent('pass-balance-changed', { detail: { newBalance: 42 } }));
 * If `detail.newBalance` is provided it's used immediately; otherwise a server fetch is triggered.
 */
export const PASS_BALANCE_EVENT = 'pass-balance-changed';

export function PassBalanceChip() {
  const [balance, setBalance] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('free');

  const refresh = useCallback(() => {
    getPassBalance().then(({ balance: b, plan: p }) => {
      setBalance(b);
      setPlan(p);
    });
  }, []);

  useEffect(() => {
    refresh();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.newBalance === 'number') {
        setBalance(detail.newBalance);
      } else {
        refresh();
      }
    };

    window.addEventListener(PASS_BALANCE_EVENT, handler);
    return () => window.removeEventListener(PASS_BALANCE_EVENT, handler);
  }, [refresh]);

  if (plan === 'free' && balance === 0) return null;

  return (
    <Link
      href="/dashboard/billing"
      className={cn(
        'flex items-center gap-1.5 h-fit p-2 rounded-xl text-xs font-semibold transition-colors',
        'bg-primary/90 text-card hover:bg-primary'
      )}
      title="Pass balance — click to manage"
    >
      <Coins className="h-3.5 w-3.5" />
      <span>{balance ?? '…'}</span>
    </Link>
  );
}
