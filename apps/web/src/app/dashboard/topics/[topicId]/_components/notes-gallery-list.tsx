import AddNoteDialog from '@/components/add-note-dialog';
import { getFilteredNotes } from '@/lib/fetchers/notes';
import NoteCardWrapper from './note-card-wrapper';
import { getTrackingStatus } from '@/lib/actions/tracking';
import { dbClient, chunk } from '@temar/db-client';
import { eq } from 'drizzle-orm';

export default async function NotesGalleryList({
  query,
  type,
  topicId,
}: {
  query: string;
  type: string;
  topicId: string;
}) {
  const [filteredNotes, trackedItems] = await Promise.all([
    getFilteredNotes(query, topicId),
    getTrackingStatus(),
  ]);

  const trackedChunkIds = new Set(trackedItems.map((t) => t.chunkId));

  // Compute per-note tracking: a note is tracked if all its chunks are tracked
  const noteTrackedMap = new Map<string, boolean>();
  for (const n of filteredNotes) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(eq(chunk.noteId, n.id));
    noteTrackedMap.set(
      n.id,
      chunks.length > 0 && chunks.every((c) => trackedChunkIds.has(c.id))
    );
  }

  return (
    <>
      {filteredNotes.map((n) => (
        <NoteCardWrapper
          key={n.id}
          note={n}
          topicId={topicId}
          isTracked={noteTrackedMap.get(n.id) ?? false}
        />
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
