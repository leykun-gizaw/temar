'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { topic } from '@temar/db-client';
import NotionCard from './notion-cards';
import EditDialog from '@/components/edit-dialog';
import { deleteTopic } from '@/lib/actions/delete';
import { updateTopic } from '@/lib/actions/update';

type Topic = typeof topic.$inferSelect;

export default function TopicCardWrapper({ item }: { item: Topic }) {
  return (
    <Link
      href={`/dashboard/topics/${encodeURIComponent(String(item.id))}/notes`}
      className="border rounded-xl hover:bg-accent h-[180px] cursor-pointer"
    >
      <NotionCard
        item={item}
        onDelete={() => {
          if (confirm('Delete this topic and all its notes/chunks?')) {
            deleteTopic(item.id);
          }
        }}
        onEdit={
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
        }
      />
    </Link>
  );
}
