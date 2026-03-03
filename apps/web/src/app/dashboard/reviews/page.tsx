import {
  getDueRecallItems,
  getDueCount,
  getAllRecallItems,
} from '@/lib/fetchers/recall-items';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import ReviewSession from './_components/review-session';
import ReviewHistory from './_components/review-history';

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

  if (dueItems.length === 0) {
    const { items: allItems } = await getAllRecallItems({ limit: 200 });
    return (
      <ReviewHistory
        allItems={allItems}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        currentTopicId={topicId}
      />
    );
  }

  return (
    <ReviewSession
      initialItems={dueItems}
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      currentTopicId={topicId}
      currentNoteId={noteId}
      dueCount={dueCount}
    />
  );
}
