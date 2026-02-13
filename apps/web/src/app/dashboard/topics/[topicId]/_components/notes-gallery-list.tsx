import Link from 'next/link';
import AddNoteDialog from '@/components/add-note-dialog';
import { getFilteredNotes } from '@/lib/fetchers/notes';
import NoteCardWrapper from './note-card-wrapper';

export default async function NotesGalleryList({
  query,
  type,
  topicId,
}: {
  query: string;
  type: string;
  topicId: string;
}) {
  const filteredNotes = await getFilteredNotes(query, topicId);
  return (
    <>
      {filteredNotes.map((n) => (
        <NoteCardWrapper key={n.id} note={n} topicId={topicId} />
      ))}

      <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
        <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
          <AddNoteDialog
            topicId={topicId}
            trigger={
              <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent hover:rounded-xl">
                + New note
              </button>
            }
          />
        </div>
      </div>
    </>
  );
}
