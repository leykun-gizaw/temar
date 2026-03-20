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
    <div className={cn('flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 shadow-md', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange-bg shrink-0">
          <Notebook className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Notes
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{notesCount}</span>
      <span className="text-[0.65rem] text-muted-foreground">
        in your workspace
      </span>
    </div>
  );
}
