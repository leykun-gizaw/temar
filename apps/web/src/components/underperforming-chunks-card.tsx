'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Loader2, Play, Info } from 'lucide-react';
import Link from 'next/link';
import type { UnderperformingChunk } from '@/lib/actions/tracking';
import { getUnderperformingChunks } from '@/lib/actions/tracking';

function severityColor(totalLapses: number, avgStability: number): string {
  if (totalLapses >= 5 || avgStability < 0.3) return 'text-red-500';
  if (totalLapses >= 3 || avgStability < 0.7) return 'text-amber-500';
  return 'text-yellow-500';
}

export default function UnderperformingChunksCard({
  initialChunks,
}: {
  initialChunks: UnderperformingChunk[];
}) {
  const [chunks, setChunks] = useState(initialChunks);
  const [minLapses, setMinLapses] = useState(2);
  const [maxStability, setMaxStability] = useState(1.0);
  const [isPending, startTransition] = useTransition();

  const fetchChunks = useCallback((lapses: number, stability: number) => {
    startTransition(async () => {
      const result = await getUnderperformingChunks(lapses, stability);
      setChunks(result);
    });
  }, []);

  // Debounce threshold changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChunks(minLapses, maxStability);
    }, 500);
    return () => clearTimeout(timer);
  }, [minLapses, maxStability, fetchChunks]);

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Underperforming Chunks
        </CardTitle>
        <CardDescription>Chunks you struggle with most.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="min-lapses" className="text-xs font-medium">
                Lapse threshold
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Lapses count how many times you forgot a card after
                    previously recalling it. Higher values mean the memory keeps
                    breaking down.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="min-lapses"
              type="number"
              min={0}
              step={1}
              value={minLapses}
              onChange={(e) =>
                setMinLapses(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="h-8 w-full"
            />
            <p className="text-[11px] text-muted-foreground">
              Show chunks with ≥ {minLapses} lapses
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="max-stability" className="text-xs font-medium">
                Stability threshold
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Stability measures memory strength in days. A stability of 5
                    means ~90% recall after 5 days. Low stability means the
                    memory is fragile.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="max-stability"
              type="number"
              min={0}
              step={0.1}
              value={maxStability}
              onChange={(e) =>
                setMaxStability(Math.max(0, parseFloat(e.target.value) || 0))
              }
              className="h-8 w-full"
            />
            <p className="text-[11px] text-muted-foreground">
              Show chunks with stability &lt; {maxStability} days
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto min-h-0">
        {isPending && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isPending && chunks.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No underperforming chunks found with current thresholds.
          </div>
        )}
        {!isPending && chunks.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chunk</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Lapses</TableHead>
                <TableHead className="text-center">Avg Stability</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chunks.map((c) => (
                <TableRow key={c.chunkId}>
                  <TableCell>
                    <span
                      className={`font-medium text-sm ${severityColor(
                        c.totalLapses,
                        c.avgStability
                      )}`}
                    >
                      {c.chunkName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {c.topicName} &gt; {c.noteName}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-sm font-medium ${severityColor(
                        c.totalLapses,
                        c.avgStability
                      )}`}
                    >
                      {c.totalLapses}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm tabular-nums">
                      {c.avgStability.toFixed(2)}d
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {c.itemCount}
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
