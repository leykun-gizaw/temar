'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { Topic } from '@/lib/topic-types';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import AddTopicDialog from '@/components/add-topic-dialog';
import { SearchParamInput } from '@/components/sidebar/search-param-input';

async function fetchTopics(query: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : '';
  const res = await fetch(`/api/topics${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch topics');
  return (await res.json()) as Topic[];
}

export function TopicsSidebarPanel() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['topics', { query }],
    queryFn: () => fetchTopics(query),
    staleTime: 30_000,
  });

  return (
    <>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-base font-medium">Topics</div>
          <div className="flex items-center gap-2">
            <AddTopicDialog />
          </div>
        </div>
        <SearchParamInput placeholder="Search topics..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading topics…
              </div>
            ) : isError ? (
              <div className="p-4 text-sm text-destructive">
                Failed to load topics.
              </div>
            ) : !data?.length ? (
              <div className="p-4 text-sm text-muted-foreground">
                No topics found.
              </div>
            ) : (
              <div className="flex flex-col">
                {data.map((topic) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('topicId');
                  params.delete('topicName');
                  const href =
                    `/dashboard/topics/${topic.id}` +
                    (params.toString() ? `?${params.toString()}` : '');
                  return (
                    <Link
                      href={href}
                      key={topic.id}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-1.5 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="font-medium">{topic.name}</span>
                        <span className="ml-auto text-xs tabular-nums">
                          {new Date(
                            topic.updatedAt || topic.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces text-muted-foreground">
                        {topic.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
