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
    <div className={cn('flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 shadow-md', className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full shrink-0',
            hasDue ? 'bg-accent-orange-bg' : 'bg-secondary'
          )}
        >
          <TestTubeDiagonal
            className={cn(
              'h-3.5 w-3.5',
              hasDue ? 'text-primary' : 'text-secondary-foreground'
            )}
          />
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Reviews
        </span>
      </div>
      <span
        className={cn(
          'text-2xl font-bold tabular-nums',
          hasDue && 'text-sr-lapsed'
        )}
      >
        {dueCount}
      </span>
      <span className="text-[0.65rem] text-muted-foreground">
        due for review
      </span>
    </div>
  );
}
