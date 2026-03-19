import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TestTubeDiagonal } from 'lucide-react';

export function ReviewItemStats({
  dueCount,
  className,
}: {
  dueCount?: number;
  className?: string;
}) {
  const hasDue = (dueCount ?? 0) > 0;
  return (
    <Card className={cn('flex flex-col gap-3 p-4 rounded-xl border', className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
            hasDue ? 'bg-sr-lapsed-bg' : 'bg-sr-recalled-bg'
          )}
        >
          <TestTubeDiagonal
            className={cn(
              'h-4 w-4',
              hasDue ? 'text-sr-lapsed' : 'text-sr-recalled'
            )}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Reviews
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            'text-3xl font-bold tabular-nums',
            hasDue && 'text-sr-lapsed'
          )}
        >
          {dueCount}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {dueCount} due for review
        </span>
      </div>
    </Card>
  );
}
