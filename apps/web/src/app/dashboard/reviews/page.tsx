import {
  getDueRecallItems,
  getDueCount,
  getAllRecallItems,
} from '@/lib/fetchers/recall-items';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getAnswerDrafts } from '@/lib/actions/review';
import ReviewsTabs from './_components/reviews-tabs';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ topicId?: string; noteId?: string }>;
}) {
  const params = await searchParams;
  const topicId = params?.topicId;
  const noteId = params?.noteId;

  const [dueItems, dueCount, allItemsResult, topics] = await Promise.all([
    getDueRecallItems({ topicId, noteId, limit: 50 }),
    getDueCount(),
    getAllRecallItems({ limit: 200 }),
    getFilteredTopics(''),
  ]);

  const answerDrafts =
    dueItems.length > 0
      ? await getAnswerDrafts(dueItems.map((item) => item.id))
      : {};

  return (
    <ReviewsTabs
      dueItems={dueItems}
      dueCount={dueCount}
      allItems={allItemsResult.items}
      answerDrafts={answerDrafts}
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      currentTopicId={topicId}
      currentNoteId={noteId}
    />
  );
}
