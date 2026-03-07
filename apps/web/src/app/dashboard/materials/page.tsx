import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getTrackingStatus } from '@/lib/actions/tracking';
import MaterialsBrowser from './_components/materials-browser';

export const dynamic = 'force-dynamic';

export default async function MaterialsPage() {
  const [topics, trackedItems] = await Promise.all([
    getFilteredTopics(''),
    getTrackingStatus(),
  ]);

  const topicTrackedMap: Record<string, Set<string>> = {};
  for (const item of trackedItems) {
    if (!topicTrackedMap[item.chunkId]) {
      topicTrackedMap[item.chunkId] = new Set();
    }
    topicTrackedMap[item.chunkId].add(item.status);
  }

  return (
    <MaterialsBrowser
      topics={topics}
      trackedItems={trackedItems}
      topicTrackedMap={topicTrackedMap}
    />
  );
}
