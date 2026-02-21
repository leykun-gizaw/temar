import clsx from 'clsx';
import { Grid2X2 } from 'lucide-react';

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
    <div
      className={clsx('flex flex-col gap-1 p-3 rounded-xl border', className)}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 items-center pr-2 border-r text-sm">
          <Grid2X2 className="h-4 w-4" />
          <span>Chunks</span>
        </div>
        <span className="text-2xl font-semibold">{chunksCount}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">
        {dueCount} due for review
      </span>
    </div>
  );
}
