'use client';

import { Target, LibraryBigIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className={cn('flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 shadow-md', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary shrink-0">
          <LibraryBigIcon className="h-3.5 w-3.5 text-secondary-foreground" />
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Topics
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{topicsCount}</span>
      <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1">
        <Target className="h-3 w-3 shrink-0" />
        {trackedCount} chunk{trackedCount !== 1 ? 's' : ''} tracked
      </span>
    </div>
  );
}
