import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export function ChunkStats({
  chunksCount,
  dueCount,
  className,
}: {
  chunksCount: number | string;
  dueCount?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 shadow-md', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Layers className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Chunks
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{chunksCount}</span>
      <span className="text-[0.65rem] text-muted-foreground">
        {dueCount} due for review
      </span>
    </div>
  );
}
