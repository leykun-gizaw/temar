'use client';

import { Target, LibraryBigIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function TopicStats({
  topicsCount,
  trackedCount,
  className,
}: {
  topicsCount: number | string;
  trackedCount?: number;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col gap-3 p-4 rounded-xl border', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <LibraryBigIcon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Topics
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-3xl font-bold tabular-nums">{topicsCount}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Target className="h-3 w-3 shrink-0" />
          {trackedCount} chunk{trackedCount !== 1 ? 's' : ''} tracked
        </span>
      </div>
    </Card>
  );
}
