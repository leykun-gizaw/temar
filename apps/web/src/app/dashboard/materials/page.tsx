import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getTrackingStatus } from '@/lib/actions/tracking';
import MaterialsBrowser from './_components/materials-browser';

export const dynamic = 'force-dynamic';

export default async function MaterialsPage() {
  const [topics, trackedItems] = await Promise.all([
    getFilteredTopics(''),
    getTrackingStatus(),
  ]);

  return (
    <MaterialsBrowser topics={topics} trackedItems={trackedItems} />
  );
}
