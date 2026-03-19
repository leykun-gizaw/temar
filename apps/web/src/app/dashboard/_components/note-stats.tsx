import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Notebook } from 'lucide-react';

export function NoteStats({
  notesCount,
  className,
}: {
  notesCount: number | string;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col gap-3 p-4 rounded-xl border', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sr-new-bg shrink-0">
          <Notebook className="h-4 w-4 text-sr-new" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Notes
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-3xl font-bold tabular-nums">{notesCount}</span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {notesCount} total
        </span>
      </div>
    </Card>
  );
}
