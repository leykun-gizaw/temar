'use client';

import { useEffect, useState } from 'react';
import { getPassBalance } from '@/lib/actions/pass';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PassBalanceChip() {
  const [balance, setBalance] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('free');

  useEffect(() => {
    getPassBalance().then(({ balance: b, plan: p }) => {
      setBalance(b);
      setPlan(p);
    });
  }, []);

  if (plan === 'free' && balance === 0) return null;

  return (
    <Link
      href="/dashboard/billing"
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
        'bg-primary/10 text-primary hover:bg-primary/20'
      )}
      title="Pass balance — click to manage"
    >
      <Coins className="h-3.5 w-3.5" />
      <span>{balance ?? '…'}</span>
    </Link>
  );
}
