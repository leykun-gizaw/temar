'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BinocularsIcon, Play, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from './ui/input';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import {
  searchRecallItemsAction,
  getAllRecallItemsAction,
} from '@/lib/actions/review';
import { cn } from '@/lib/utils';

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const STATE_STYLES: Record<number, string> = {
  0: 'bg-primary/10 text-primary',
  1: 'bg-accent-orange-bg text-primary',
  2: 'bg-secondary/30 text-secondary-foreground',
  3: 'bg-destructive/10 text-destructive',
};

const PAGE_SIZE = 10;

function retrievabilityPercent(stability: number): number {
  if (!stability) return 0;
  return Math.min(100, Math.round((stability / (stability + 1)) * 100));
}

function retrievabilityColor(pct: number): string {
  if (pct >= 70) return 'bg-secondary-foreground';
  if (pct >= 40) return 'bg-primary';
  return 'bg-muted-foreground/40';
}

export default function ReviewsTableCard({
  items: initialItems,
  total: initialTotal,
  className,
}: {
  items: RecallItemDue[];
  total: number;
  className?: string;
}) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<RecallItemDue[] | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [currentItems, setCurrentItems] = useState(initialItems);
  const [currentTotal, setCurrentTotal] = useState(initialTotal);

  const isSearchMode = search.trim().length > 0;

  // Fetch page data when page changes (non-search mode)
  useEffect(() => {
    if (isSearchMode) return;
    if (page === 1) {
      setCurrentItems(initialItems);
      setCurrentTotal(initialTotal);
      return;
    }
    startTransition(async () => {
      const result = await getAllRecallItemsAction(
        PAGE_SIZE,
        (page - 1) * PAGE_SIZE
      );
      setCurrentItems(result.items);
      setCurrentTotal(result.total);
    });
  }, [page, isSearchMode, initialItems, initialTotal]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchRecallItemsAction(search.trim());
        setSearchResults(results);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when entering/leaving search mode
  useEffect(() => {
    setPage(1);
  }, [isSearchMode]);

  // Display logic
  const displayItems = useMemo(() => {
    if (isSearchMode && searchResults) {
      const start = (page - 1) * PAGE_SIZE;
      return searchResults.slice(start, start + PAGE_SIZE);
    }
    return currentItems;
  }, [isSearchMode, searchResults, currentItems, page]);

  const displayTotal = isSearchMode ? searchResults?.length ?? 0 : currentTotal;

  return (
    <Card
      className={cn(
        'min-h-0 overflow-hidden rounded-[2.5rem] bg-card p-8',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recall Items</h2>
          <p className="text-muted-foreground text-sm">
            {displayTotal > 0
              ? `${displayTotal} tracked item${displayTotal !== 1 ? 's' : ''}${
                  isSearchMode ? ' matching search' : ' in your workspace'
                }`
              : isSearchMode
              ? 'No items match your search'
              : 'No tracked items'}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            aria-label="Search recall items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 bg-muted/50 border-none rounded-2xl h-11"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2">
          <thead className="text-left text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest">
            <tr>
              <th className="px-4 pb-2">Item</th>
              <th className="px-4 pb-2">State</th>
              <th className="px-4 pb-2">Reps</th>
              <th className="px-4 pb-2">Retrievability</th>
              <th className="px-4 pb-2">Due</th>
              <th className="px-4 pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {displayItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  No recall items found
                </td>
              </tr>
            )}
            {displayItems.map((item) => {
              const ret = retrievabilityPercent(item.stability);
              const isDue = new Date(item.due).getTime() <= Date.now();
              return (
                <tr
                  key={item.id}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-4 rounded-l-2xl">
                    <div className="font-semibold">
                      {item.questionTitle || item.chunkName}
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground">
                      {item.topicName} &gt; {item.noteName}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase',
                        STATE_STYLES[item.state] ??
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {STATE_LABELS[item.state] ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium">{item.reps}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            retrievabilityColor(ret)
                          )}
                          style={{ width: `${ret}%` }}
                        />
                      </div>
                      {ret > 0 && (
                        <span className="text-[0.65rem] font-bold text-muted-foreground">
                          {ret}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isDue ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {formatDueDate(item.due)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right rounded-r-2xl">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full hover:bg-muted text-primary"
                      asChild
                    >
                      <Link href="/dashboard/reviews">
                        <Play className="h-4 w-4" fill="currentColor" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View All button */}
      <Button
        variant="ghost"
        className="w-fit bg-muted/50 text-muted-foreground font-bold text-sm hover:bg-muted"
        asChild
      >
        <Link
          href="/dashboard/reviews"
          className="flex rounded-full items-center gap-2"
        >
          <BinocularsIcon className="h-4 w-4" />
          View All Recall Items
        </Link>
      </Button>
    </Card>
  );
}

function formatDueDate(due: string | Date): string {
  const d = new Date(due);
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
