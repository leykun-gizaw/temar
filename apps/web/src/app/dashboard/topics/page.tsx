import { Topic } from '@/lib/topic-types';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/query-provider';
import TopicsView from './topics-view';

async function fetchTopics(query: string | undefined): Promise<Topic[]> {
  // Simulate fetching topics from an API. If a query is provided, filter the topics.
  const qs = query ? `?query=${encodeURIComponent(query)}` : '';
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000'
    }/api/topics${qs}`,
    {
      // Important: cache: 'no-store' or revalidate strategy depending on freshness needs
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch topics');
  }
  return res.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page: string }>;
}) {
  const { query = '' } = await searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['topics', { query }],
    queryFn: () => fetchTopics(query),
  });

  const dehydrated = dehydrate(queryClient);

  return (
    <QueryProvider state={dehydrated}>
      <TopicsView query={query} />
    </QueryProvider>
  );
}
