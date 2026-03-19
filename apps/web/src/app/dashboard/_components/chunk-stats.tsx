import { Card } from '@/components/ui/card';
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
    <Card className={cn('flex flex-col gap-3 p-4 rounded-xl border', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sr-due-bg shrink-0">
          <Layers className="h-4 w-4 text-sr-due" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Chunks
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-3xl font-bold tabular-nums">{chunksCount}</span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {dueCount} due for review
        </span>
      </div>
    </Card>
  );
}
