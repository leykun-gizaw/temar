'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteNote } from '@/lib/actions/delete';
import { updateNote } from '@/lib/actions/update';
import EditDialog from '@/components/edit-dialog';

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
    <div className="h-[180px] flex flex-col">
      <Link
        href={`/dashboard/topics/${topicId}/notes/${encodeURIComponent(
          note.id
        )}/chunks`}
        className="flex flex-col flex-1 border border-b-0 hover:bg-muted bg-muted/50 rounded-t-xl cursor-pointer text-muted-foreground"
      >
        <div className="flex-1 text-xs whitespace-pre-wrap p-4">
          {excerpt(note.description)}
        </div>
      </Link>
      <div className="h-1/4 flex items-center justify-between p-2 border rounded-b-xl">
        <span className="text-sm font-semibold">📘 {note.name}</span>
        <div className="flex items-center gap-1">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <EditDialog
              entityType="note"
              currentName={note.name}
              currentDescription={note.description}
              onSave={async (name, description) => {
                await updateNote(note.id, topicId, name, description);
              }}
              trigger={
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1"
                  title="Edit note"
                >
                  <Pencil size={14} />
                </button>
              }
            />
          </div>
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
      </div>
    </div>
  );
}
