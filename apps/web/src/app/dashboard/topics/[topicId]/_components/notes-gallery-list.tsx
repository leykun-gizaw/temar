import AddNoteDialog from '@/components/add-note-dialog';
import { getFilteredNotes } from '@/lib/fetchers/notes';

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

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
      {filteredNotes.map((note) => (
        <div
          key={note.id}
          className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
        >
          <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
            {excerpt(note.description)}
          </div>
          <div className="h-1/4 flex items-center pl-4">
            <span className="text-sm font-semibold">📘 {note.title}</span>
          </div>
        </div>
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
