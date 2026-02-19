'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { topic } from '@temar/db-client';
import EditDialog from '@/components/edit-dialog';
import { deleteTopic } from '@/lib/actions/delete';
import { updateTopic } from '@/lib/actions/update';
import TrackingButton from '@/components/tracking-button';
import Blinker from '@/components/blinker';

type Topic = typeof topic.$inferSelect;

export default function TopicCardWrapper({
  item,
  isTracked = false,
}: {
  item: Topic;
  isTracked?: boolean;
}) {
  const onEdit = (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <EditDialog
        entityType="topic"
        currentName={item.name}
        currentDescription={item.description}
        onSave={async (name, description) => {
          await updateTopic(item.id, name, description);
        }}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1"
            title="Edit topic"
          >
            <Pencil size={14} />
          </button>
        }
      />
    </div>
  );

  const onDelete = () => {
    if (confirm('Delete this topic and all its notes/chunks?')) {
      deleteTopic(item.id);
    }
  };

  return (
    <div className="relative flex flex-col h-[180px]">
      {isTracked && (
        <div className="absolute top-2 right-2 z-10">
          <Blinker />
        </div>
      )}
      <Link
        href={`/dashboard/topics/${encodeURIComponent(String(item.id))}/notes`}
        className="border border-b-0 text-muted-foreground rounded-t-xl hover:bg-accent cursor-pointer flex flex-col flex-1"
      >
        <div className="text-xs whitespace-pre-wrap p-4 bg-muted/50 rounded-t-xl h-full">
          {item.description}
        </div>
      </Link>

      <div className="h-fit flex items-center justify-between p-2 border rounded-b-xl">
        <span className="text-sm font-semibold">
          📚
          {item.name}
        </span>
        <div className="flex items-center gap-2">
          {onEdit}
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
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex"
          >
            <TrackingButton
              entityType="topic"
              entityId={item.id}
              isTracked={isTracked}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
