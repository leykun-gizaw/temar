import { notFound } from 'next/navigation';
import { getTopicById } from '@/lib/fetchers/topics';
import { getFilteredNotes } from '@/lib/fetchers/notes';
import { getCascadeInfo } from '@/lib/actions/tracking';
import TopicDetail from '../_components/topic-detail';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  const [topic, notes, cascadeInfo] = await Promise.all([
    getTopicById(topicId),
    getFilteredNotes('', topicId),
    getCascadeInfo('topic', topicId),
  ]);

  if (!topic) notFound();

  return (
    <TopicDetail
      topic={topic}
      noteCount={notes.length}
      isTracked={cascadeInfo.tracked > 0}
    />
  );
}
