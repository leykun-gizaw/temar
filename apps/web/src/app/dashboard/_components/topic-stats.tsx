'use client';

import { Target, LibraryBigIcon } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div
      className={clsx('flex flex-col gap-1 p-3 rounded-xl border', className)}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 items-center pr-2 border-r text-sm">
          <LibraryBigIcon className="h-4 w-4" />
          <span>Topics</span>
        </div>
        <span className="text-2xl font-semibold">{topicsCount}</span>
      </div>
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Target className="h-3 w-3" />
        {trackedCount} chunk{trackedCount !== 1 ? 's' : ''} tracked
      </span>
    </div>
  );
}
