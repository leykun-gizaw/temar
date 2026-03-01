import { Card } from '@/components/ui/card';
import clsx from 'clsx';
import { Notebook } from 'lucide-react';

export function NoteStats({
  notesCount,
  className,
}: {
  notesCount: number | string;
  className?: string;
}) {
  return (
    <Card
      className={clsx('flex flex-col gap-1 p-3 rounded-xl border', className)}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 items-center pr-2 border-r text-sm">
          <Notebook className="h-4 w-4" />
          <span>Notes</span>
        </div>
        <span className="text-2xl font-semibold">{notesCount}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">
        {notesCount} total
      </span>
    </Card>
  );
}
