'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Topic } from '@/lib/topic-types';

async function fetchTopicByIdClient(topicId: string): Promise<Topic | null> {
  // Fallback when not in cache yet; swap to /api/topics/[id] when available
  const res = await fetch('/api/topics', { cache: 'no-store' });
  if (!res.ok) return null;
  const topics = (await res.json()) as Topic[];
  return topics.find((t) => String(t.id) === String(topicId)) ?? null;
}

export default function TopicTitleFromCache({
  topicId,
  fallback,
}: {
  topicId: string;
  fallback?: string;
}) {
  const qc = useQueryClient();

  // Try to read from any cached 'topics' queries (e.g., sidebar list)
  const cachedName = React.useMemo(() => {
    const entries = qc.getQueriesData<Topic[]>({ queryKey: ['topics'] });
    for (const [, data] of entries) {
      const found = data?.find?.((t) => String(t.id) === String(topicId));
      if (found) return found.name;
    }
    return undefined;
  }, [qc, topicId]);

  // If not in cache, fetch once
  const { data } = useQuery({
    queryKey: ['topic', topicId],
    enabled: !cachedName,
    queryFn: () => fetchTopicByIdClient(topicId),
    staleTime: 30_000,
  });

  return <>{cachedName ?? data?.name ?? fallback ?? 'Topic'}</>;
}
