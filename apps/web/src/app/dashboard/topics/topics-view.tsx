'use client';

import { useQuery } from '@tanstack/react-query';
import AddTopicDialog from '@/components/add-topic-dialog';
import TopicsList from './topics-list';
import SearchInput from './search-topics';
import { LibraryBig } from 'lucide-react';

async function fetchTopics(query: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : '';
  return fetch(`/api/topics${qs}`).then((r) => {
    if (!r.ok) throw new Error('Failed');
    return r.json();
  });
}

export default function TopicsView({ query }: { query: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topics', { query }],
    queryFn: () => fetchTopics(query),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div className="flex justify-between p-6 pb-0">
        <div className="flex items-center">
          <LibraryBig />
          <h1 className="text-2xl">Topics</h1>
        </div>
        <div className="flex gap-4 items-center">
          <SearchInput placeholder="Search topics..." />
          <AddTopicDialog />
        </div>
      </div>
      <div className="flex-1 p-6 pt-0 h-full min-h-0">
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-destructive">Error loading topics</div>}
        {data && <TopicsList topics={data} />}
      </div>
    </div>
  );
}
