import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getOutdatedChunks } from '@/lib/actions/tracking';
import TreeSidebar from './_components/tree-sidebar';

export const dynamic = 'force-dynamic';

export default async function MaterialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topics, outdatedChunks] = await Promise.all([
    getFilteredTopics(''),
    getOutdatedChunks(),
  ]);

  return (
    <div className="relative flex gap-5 h-[calc(100vh-var(--header-height))] min-h-0 p-5">
      <TreeSidebar
        topics={topics}
        outdatedChunks={outdatedChunks}
      />
      {children}
    </div>
  );
}
