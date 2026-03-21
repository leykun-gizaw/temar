import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getTrackingStatus, getOutdatedChunks } from '@/lib/actions/tracking';
import MaterialsBrowser from './_components/materials-browser';

export const dynamic = 'force-dynamic';

export default async function MaterialsPage() {
  const [topics, trackedItems, outdatedChunks] = await Promise.all([
    getFilteredTopics(''),
    getTrackingStatus(),
    getOutdatedChunks(),
  ]);

  return (
    <MaterialsBrowser
      topics={topics}
      trackedItems={trackedItems}
      outdatedChunks={outdatedChunks}
    />
  );
}
