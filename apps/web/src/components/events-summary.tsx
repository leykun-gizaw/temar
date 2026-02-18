'use client';

import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import DashboardCountdown from '@/components/dashboard-countdown';
import { Button } from './ui/button';
import Link from 'next/link';
import { BellRing } from 'lucide-react';

type Props = { items: RecallItemDue[] };

export function EventsSummary({ items }: Props) {
  const now = Date.now();

  // Items whose due date is in the past or right now
  const dueNow = items.filter((i) => new Date(i.due).getTime() <= now);
  const currentItem = dueNow[0] ?? null;

  // Items whose due date is in the future
  const upcoming = items
    .filter((i) => new Date(i.due).getTime() > now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
  const nextItem = upcoming[0] ?? null;

  return (
    <div className="border p-4 rounded-xl flex gap-4 items-center justify-between flex-wrap">
      <div className="flex flex-col h-full justify-between">
        <span className="text-xl">Due Now</span>
        <span className="text-muted-foreground text-sm">
          {currentItem ? (
            <Button>
              <Link
                className="flex gap-2 items-center"
                href="/dashboard/reviews"
              >
                <span className="relative flex size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-85" />
                  <span className="relative inline-flex size-4 rounded-full bg-primary">
                    <BellRing />
                  </span>
                </span>
                <span>
                  {currentItem.chunkName}
                  {dueNow.length > 1 && ` +${dueNow.length - 1} more`}
                </span>
              </Link>
            </Button>
          ) : (
            'No items due right now'
          )}
        </span>
      </div>
      <div className="flex flex-col items-end h-full">
        <span className="text-xl">Next</span>
        <span className="text-sm text-muted-foreground">
          {nextItem ? (
            <div className="flex flex-col text-muted-foreground text-sm items-end">
              <span>{nextItem.chunkName}</span>
              <span className="tabular-nums">
                Due in <DashboardCountdown target={nextItem.due} />
              </span>
            </div>
          ) : (
            'No upcoming reviews'
          )}
        </span>
      </div>
    </div>
  );
}
