import { getFilteredChunks } from '@/lib/fetchers/chunks';

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default async function ChunksGalleryList({
  query,
  noteId,
}: {
  query: string;
  noteId: string;
}) {
  const filteredChunks = await getFilteredChunks(query, noteId);
  return (
    <>
      {filteredChunks.map((chunk) => (
        <div
          key={chunk.id}
          className="border rounded-xl flex flex-col h-[180px]"
        >
          <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50 overflow-hidden">
            {excerpt(chunk.contentMd || chunk.description)}
          </div>
          <div className="h-1/4 flex items-center pl-4">
            <span className="text-sm font-semibold">📄 {chunk.name}</span>
          </div>
        </div>
      ))}
    </>
  );
}
