'use client';

import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { BellRing } from 'lucide-react';
import clsx from 'clsx';

export function EventsSummary({
  dueItems,
  className,
}: {
  dueItems: RecallItemDue[];
  className?: string;
}) {
  const now = Date.now();

  // Items whose due date is in the past or right now
  const dueNow = dueItems.filter((i) => new Date(i.due).getTime() <= now);
  const currentItem = dueNow[0] ?? null;

  return (
    <div
      className={clsx('flex flex-col gap-2 h-full justify-around', className)}
    >
      <div className="flex flex-col">
        <span className="text-xl">Due Items</span>
        <span className="text-xs text-muted-foreground">
          Recall items for you to review now
        </span>
      </div>
      <span className="text-muted-foreground text-sm">
        {currentItem ? (
          <Button variant={'outline'}>
            <Link className="flex gap-2 items-center" href="/dashboard/reviews">
              <span className="relative flex size-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary" />
                <span className="relative inline-flex size-4 rounded-full bg-white">
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
          <span>No items due right now</span>
        )}
      </span>
    </div>
  );
}
