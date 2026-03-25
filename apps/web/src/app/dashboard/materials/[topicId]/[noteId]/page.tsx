import { notFound } from 'next/navigation';
import { getTopicById } from '@/lib/fetchers/topics';
import { getNoteById } from '@/lib/fetchers/notes';
import { getFilteredChunks } from '@/lib/fetchers/chunks';
import { getCascadeInfo } from '@/lib/actions/tracking';
import NoteDetail from '../../_components/note-detail';

export default async function NotePage({
  params,
}: {
  params: Promise<{ topicId: string; noteId: string }>;
}) {
  const { topicId, noteId } = await params;

  const [topic, note, chunks, cascadeInfo] = await Promise.all([
    getTopicById(topicId),
    getNoteById(noteId),
    getFilteredChunks('', noteId),
    getCascadeInfo('note', noteId),
  ]);

  if (!topic || !note) notFound();

  return (
    <NoteDetail
      note={note}
      topicId={topicId}
      topicName={topic.name}
      chunkCount={chunks.length}
      isTracked={cascadeInfo.tracked > 0}
    />
  );
}
