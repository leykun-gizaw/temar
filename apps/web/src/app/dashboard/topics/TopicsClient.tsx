'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Topic } from '@/lib/topic-types';
import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGridIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function fetchTopicsClient(query?: string): Promise<Topic[]> {
  const url = new URL('/api/topics', window.location.origin);
  if (query) url.searchParams.set('query', query);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  return (await res.json()) as Topic[];
}

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default function TopicsClient({ query }: { query?: string }) {
  const qc = useQueryClient();
  const topicsKey = ['topics', { query }] as const;
  const initialExact = qc.getQueryData<Topic[]>(topicsKey);
  const initialAny =
    initialExact ??
    qc
      .getQueriesData<Topic[]>({ queryKey: ['topics'] })
      .map(([, data]) => data)
      .find(Boolean);

  const {
    data: topics = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: topicsKey,
    queryFn: () => fetchTopicsClient(query),
    initialData: initialAny,
    staleTime: 30_000,
  });

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <span className="text-5xl">📚</span>
        <h1 className="text-2xl font-semibold mb-4">Topics</h1>
        <p className="text-sm text-muted-foreground">
          Select a topic to view its notes.
        </p>
      </div>
      <hr />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <h1 className="text-lg font-bold bg-primary/10 p-2">Topics Gallery</h1>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2 bg-muted py-2 px-3 rounded-full">
            <LayoutGridIcon size={16} />
            Topics Gallery
          </span>
          <AddTopicDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                New
              </Button>
            }
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading topics…
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load topics.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/dashboard/topics/${encodeURIComponent(String(topic.id))}`}
            className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
          >
            <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
              {excerpt(topic.description)}
            </div>
            <div className="h-1/4 flex items-center pl-4">
              <span className="text-sm font-semibold">📚 {topic.name}</span>
            </div>
          </Link>
        ))}
        <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
          <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
            <AddTopicDialog
              trigger={
                <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent">
                  + New topic
                </button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
