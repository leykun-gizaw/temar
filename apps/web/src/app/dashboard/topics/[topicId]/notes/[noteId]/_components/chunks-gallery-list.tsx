import { getFilteredChunks } from '@/lib/fetchers/chunks';
import ChunkCard from './chunk-card';

export default async function ChunksGalleryList({
  query,
  noteId,
  topicId,
}: {
  query: string;
  noteId: string;
  topicId: string;
}) {
  const filteredChunks = await getFilteredChunks(query, noteId);
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
        />
      ))}
    </>
  );
}
