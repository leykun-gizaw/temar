'use client';

import Link from 'next/link';
import { topic } from '@temar/db-client';
import NotionCard from './notion-cards';
import { deleteTopic } from '@/lib/actions/delete';

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
      />
    </Link>
  );
}
