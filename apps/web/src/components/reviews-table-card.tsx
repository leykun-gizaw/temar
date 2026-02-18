'use client';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { BinocularsIcon, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from './ui/input';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import {
  searchRecallItemsAction,
  getAllRecallItemsAction,
} from '@/lib/actions/review';

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const PAGE_SIZE = 10;

function retrievabilityPercent(stability: number): number {
  if (!stability) return 0;
  return Math.min(100, Math.round((stability / (stability + 1)) * 100));
}

export default function ReviewsTableCard({
  items: initialItems,
  total: initialTotal,
}: {
  items: RecallItemDue[];
  total: number;
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
  const displayTotalPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > displayTotalPages) return;
      setPage(newPage);
    },
    [displayTotalPages]
  );

  // Generate page numbers to show
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (displayTotalPages <= 5) {
      for (let i = 1; i <= displayTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(displayTotalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < displayTotalPages - 2) pages.push('ellipsis');
      pages.push(displayTotalPages);
    }
    return pages;
  }, [page, displayTotalPages]);

  return (
    <Card className="min-h-0 shadow-none">
      <CardHeader className="border-b">
        <CardTitle>Recall Items</CardTitle>
        <CardAction>
          <Button asChild variant={'outline'}>
            <Link href="/dashboard/reviews">
              <BinocularsIcon />
            </Link>
          </Button>
        </CardAction>
        <CardDescription>
          {displayTotal > 0
            ? `${displayTotal} tracked item${displayTotal !== 1 ? 's' : ''}${
                isSearchMode ? ' matching search' : ''
              }`
            : isSearchMode
            ? 'No items match your search'
            : 'No tracked items'}
        </CardDescription>
        <div className="mt-2 relative">
          <Input
            placeholder="Search all recall items..."
            aria-label="Search recall items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>Retrievability</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No recall items found
                </TableCell>
              </TableRow>
            )}
            {displayItems.map((item) => {
              const ret = retrievabilityPercent(item.stability);
              const isDue = new Date(item.due).getTime() <= Date.now();
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.chunkName}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.topicName} &gt; {item.noteName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                      {STATE_LABELS[item.state] ?? 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>{item.reps}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress value={ret} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {ret}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${
                        isDue
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(item.due).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/reviews">
                        <Play className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {displayTotalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  size="default"
                  onClick={() => handlePageChange(page - 1)}
                  className={
                    page <= 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => handlePageChange(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  size="default"
                  onClick={() => handlePageChange(page + 1)}
                  className={
                    page >= displayTotalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
