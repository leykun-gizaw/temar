import { Card } from '@/components/ui/card';
import clsx from 'clsx';
import { TestTubeDiagonal } from 'lucide-react';

export function ReviewItemStats({
  dueCount,
  className,
}: {
  dueCount?: number;
  className?: string;
}) {
  return (
    <Card
      className={clsx('flex flex-col gap-1 p-3 rounded-xl border', className)}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 items-center pr-2 border-r text-sm">
          <TestTubeDiagonal className="h-4 w-4" />
          <span>Reviews</span>
        </div>
        <span className="text-2xl font-semibold">{dueCount}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">
        {dueCount} due for review
      </span>
    </Card>
  );
}
