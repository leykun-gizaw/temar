import { getFilteredChunks } from '@/lib/fetchers/chunks';
import { getTrackingStatus } from '@/lib/actions/tracking';
import ChunkCard from './chunk-card';
import AddChunkDialog from './add-chunk-dialog';

export default async function ChunksGalleryList({
  query,
  noteId,
  topicId,
}: {
  query: string;
  noteId: string;
  topicId: string;
}) {
  const [filteredChunks, trackedItems] = await Promise.all([
    getFilteredChunks(query, noteId),
    getTrackingStatus(),
  ]);
  const trackedChunkIds = new Set(trackedItems.map((t) => t.chunkId));

  return (
    <>
      {filteredChunks.map((chunk) => (
        <ChunkCard
          key={chunk.id}
          id={chunk.id}
          name={chunk.name}
          description={chunk.description}
          contentMd={chunk.contentMd}
          contentJson={chunk.contentJson}
          topicId={topicId}
          noteId={noteId}
          isTracked={trackedChunkIds.has(chunk.id)}
        />
      ))}
      <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
        <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
          <AddChunkDialog
            noteId={noteId}
            topicId={topicId}
            trigger={
              <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent hover:rounded-xl">
                + New chunk
              </button>
            }
          />
        </div>
      </div>
    </>
  );
}
