'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NavUser } from '@/components/nav-user';
import type { Topic } from '@/lib/topic-types';
import { Fragment } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function SiteHeader({
  userData,
}: {
  userData: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const pathname = usePathname() ?? '/';
  const qc = useQueryClient();
  const segments = pathname.split('/').filter(Boolean);
  const items = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  // If on /dashboard/topics/[topicId], try to read the topic name from cache only (no fetch)
  const topicNameFromCache = (() => {
    if (
      segments.length >= 3 &&
      segments[0] === 'dashboard' &&
      segments[1] === 'topics'
    ) {
      const topicId = segments[2];
      const entries = qc.getQueriesData<Topic[]>({ queryKey: ['topics'] });
      for (const [, data] of entries) {
        const found = data?.find?.((t) => String(t.id) === String(topicId));
        if (found) return found.name;
      }
    }
    return undefined;
  })();
  const router = useRouter();

  return (
    <header className="bg-background/70 sticky top-0 z-50 h-12 flex shrink-0 items-center backdrop-blur-lg">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.forward()}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {items.map((item, i) => {
                const isTopicLeaf =
                  item.isLast &&
                  segments.length >= 3 &&
                  segments[0] === 'dashboard' &&
                  segments[1] === 'topics' &&
                  i === 2;
                const displayLabel = isTopicLeaf
                  ? topicNameFromCache ?? item.label
                  : item.label;

                return (
                  <Fragment key={item.href}>
                    <BreadcrumbItem className="text-xs">
                      {item.isLast ? (
                        <BreadcrumbPage className="text-base">
                          {displayLabel}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="text-base">
                          <Link href={item.href}>{displayLabel}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {i < items.length - 1 ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NavUser user={userData} />
        </div>
      </div>
    </header>
  );
}
