import { getDueRecallItems, getDueCount } from '@/lib/fetchers/recall-items';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import ReviewSession from './_components/review-session';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ topicId?: string; noteId?: string }>;
}) {
  const params = await searchParams;
  const topicId = params?.topicId;
  const noteId = params?.noteId;

  const [dueItems, dueCount, topics] = await Promise.all([
    getDueRecallItems({ topicId, noteId, limit: 50 }),
    getDueCount(),
    getFilteredTopics(''),
  ]);

  return (
    <div className="h-full space-y-6">
      <ReviewSession
        initialItems={dueItems}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        currentTopicId={topicId}
        currentNoteId={noteId}
        dueCount={dueCount}
      />
    </div>
  );
}
