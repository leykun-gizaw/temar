import { getChunkById } from '@/lib/fetchers/chunks';
import { getTopicById } from '@/lib/fetchers/topics';
import { getNoteById } from '@/lib/fetchers/notes';
import { notFound } from 'next/navigation';
import ChunkEditClient from './_components/chunk-edit-client';

export default async function ChunkEditPage({
  params,
}: {
  params: Promise<{ topicId: string; noteId: string; chunkId: string }>;
}) {
  const { topicId, noteId, chunkId } = await params;

  const [chunk, topic, note] = await Promise.all([
    getChunkById(chunkId),
    getTopicById(topicId),
    getNoteById(noteId),
  ]);

  if (!chunk || !topic || !note) {
    notFound();
  }

  return (
    <ChunkEditClient
      chunk={{
        id: chunk.id,
        name: chunk.name,
        description: chunk.description,
        contentJson: chunk.contentJson,
        contentMd: chunk.contentMd,
      }}
      topicId={topicId}
      noteId={noteId}
      topicName={topic.name}
      noteName={note.name}
    />
  );
}
