'use client';

import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
    <Card
      className={cn(
        'flex flex-col gap-3 p-4 rounded-xl border justify-between',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
            currentItem ? 'bg-sr-lapsed-bg' : 'bg-sr-recalled-bg'
          )}
        >
          {currentItem ? (
            <BellRing className="h-4 w-4 text-sr-lapsed" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-sr-recalled" />
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Due Now
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {currentItem ? (
          <>
            <span className="text-3xl font-bold tabular-nums text-sr-lapsed">
              {dueNow.length}
            </span>
            <span className="text-xs text-muted-foreground">
              item{dueNow.length !== 1 ? 's' : ''} awaiting review
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold tabular-nums text-sr-recalled">
              0
            </span>
            <span className="text-xs text-muted-foreground">
              all caught up!
            </span>
          </>
        )}
      </div>

      {currentItem && (
        <Button variant="outline" size="sm" className="w-full mt-1" asChild>
          <Link className="flex gap-2 items-center" href="/dashboard/reviews">
            <span className="relative flex size-3.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sr-lapsed opacity-60" />
              <span className="relative inline-flex size-3.5 rounded-full bg-sr-lapsed" />
            </span>
            <span className="truncate text-xs">
              {currentItem.chunkName}
              {dueNow.length > 1 && ` +${dueNow.length - 1} more`}
            </span>
          </Link>
        </Button>
      )}
    </Card>
  );
}
