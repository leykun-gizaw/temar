'use client';

import { topic } from '@temar/db-client';
import { Trash2 } from 'lucide-react';

type Topic = typeof topic.$inferSelect;

export default function NotionCard({
  item,
  onDelete,
}: {
  item: Topic;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="border-b flex-1 text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
        {item.description}
      </div>
      <div className="h-fit flex items-center justify-between p-3">
        <span className="text-sm font-semibold">
          📚
          {item.name}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
            title="Delete topic"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
