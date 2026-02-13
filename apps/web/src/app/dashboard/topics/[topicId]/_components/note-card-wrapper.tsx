'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { deleteNote } from '@/lib/actions/delete';

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default function NoteCardWrapper({
  note,
  topicId,
}: {
  note: { id: string; name: string; description: string };
  topicId: string;
}) {
  return (
    <Link
      href={`/dashboard/topics/${topicId}/notes/${encodeURIComponent(note.id)}/chunks`}
      className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
    >
      <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
        {excerpt(note.description)}
      </div>
      <div className="h-1/4 flex items-center justify-between pl-4 pr-3">
        <span className="text-sm font-semibold">📘 {note.name}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Delete this note and all its chunks?')) {
              deleteNote(note.id, topicId);
            }
          }}
          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
          title="Delete note"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Link>
  );
}
