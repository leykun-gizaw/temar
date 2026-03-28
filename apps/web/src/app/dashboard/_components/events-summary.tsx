'use client';

import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import { Button } from '@temar/ui';
import Link from 'next/link';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EventsSummary({
  dueItems,
  className,
}: {
  dueItems: RecallItemDue[];
  className?: string;
}) {
  const now = Date.now();

  const dueNow = dueItems.filter((i) => new Date(i.due).getTime() <= now);
  const currentItem = dueNow[0] ?? null;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-2xl bg-primary/5 shadow-md',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full shrink-0',
            currentItem ? 'bg-destructive/15' : 'bg-secondary'
          )}
        >
          {currentItem ? (
            <BellRing className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-secondary-foreground" />
          )}
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Due Now
        </span>
      </div>

      <span
        className={cn(
          'text-2xl font-bold tabular-nums',
          currentItem ? 'text-sr-lapsed' : 'text-sr-recalled'
        )}
      >
        {dueNow.length}
      </span>

      {currentItem ? (
        <Button variant="ghost" size="sm" className="w-full h-7 text-[0.65rem] px-2 bg-background/60 rounded-lg" asChild>
          <Link className="flex gap-1.5 items-center" href="/dashboard/reviews">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sr-lapsed opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-sr-lapsed" />
            </span>
            <span className="truncate">
              {currentItem.chunkName}
              {dueNow.length > 1 && ` +${dueNow.length - 1}`}
            </span>
          </Link>
        </Button>
      ) : (
        <span className="text-[0.65rem] text-muted-foreground">
          all caught up!
        </span>
      )}
    </div>
  );
}
