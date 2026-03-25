import { notFound } from 'next/navigation';
import { getTopicById } from '@/lib/fetchers/topics';
import { getNoteById } from '@/lib/fetchers/notes';
import { getChunkById } from '@/lib/fetchers/chunks';
import { getTrackingStatus, getOutdatedChunks, type TrackingItem, type OutdatedChunk } from '@/lib/actions/tracking';
import ChunkDetail from '../../../_components/chunk-detail';

export default async function ChunkPage({
  params,
}: {
  params: Promise<{ topicId: string; noteId: string; chunkId: string }>;
}) {
  const { topicId, noteId, chunkId } = await params;

  const [topic, note, chunk, trackedItems, outdatedChunks] = await Promise.all([
    getTopicById(topicId),
    getNoteById(noteId),
    getChunkById(chunkId),
    getTrackingStatus(),
    getOutdatedChunks(),
  ]);

  if (!topic || !note || !chunk) notFound();

  const trackedChunkIds = new Set(trackedItems.map((item: TrackingItem) => item.chunkId));
  const outdatedInfo = outdatedChunks.find((c: OutdatedChunk) => c.chunkId === chunkId) ?? null;

  return (
    <ChunkDetail
      chunk={chunk}
      topicId={topicId}
      topicName={topic.name}
      noteId={noteId}
      noteName={note.name}
      isTracked={trackedChunkIds.has(chunk.id)}
      outdatedInfo={outdatedInfo}
    />
  );
}
