'use client';

import { useState, useMemo } from 'react';
import { BookOpen, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Card,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@temar/ui';

interface TopicLeaderboardProps {
  data: Array<{
    topicId: string;
    topicName: string;
    itemCount: number;
    avgStability: number;
    avgDifficulty: number;
    totalLapses: number;
    totalReviews: number;
    avgRating: number;
  }>;
}

type SortKey = keyof TopicLeaderboardProps['data'][number];
type SortDirection = 'asc' | 'desc';

function ratingBadgeVariant(rating: number) {
  if (rating <= 2) return 'destructive' as const;
  if (rating <= 3) return 'outline' as const;
  return 'secondary' as const;
}

export function TopicLeaderboard({ data }: TopicLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalReviews');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="inline h-3 w-3 ml-0.5" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-0.5" />
    );
  };

  const isEmpty = !data || data.length === 0;

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Topic Performance</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No topics yet
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('topicName')}
              >
                Topic
                <SortIcon column="topicName" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('itemCount')}
              >
                Items
                <SortIcon column="itemCount" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('avgStability')}
              >
                Avg Stability
                <SortIcon column="avgStability" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('avgDifficulty')}
              >
                Avg Difficulty
                <SortIcon column="avgDifficulty" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('totalLapses')}
              >
                Lapses
                <SortIcon column="totalLapses" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('totalReviews')}
              >
                Reviews
                <SortIcon column="totalReviews" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('avgRating')}
              >
                Avg Rating
                <SortIcon column="avgRating" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.topicId} className="hover:bg-background/50">
                <TableCell className="font-medium max-w-[200px] truncate">
                  {row.topicName}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.itemCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.avgStability.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.avgDifficulty.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.totalLapses}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.totalReviews}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={ratingBadgeVariant(row.avgRating)}>
                    {row.avgRating.toFixed(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </Card>
  );
}
