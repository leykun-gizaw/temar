'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@temar/ui';
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type { TrackingItem } from '@/lib/actions/tracking';
import {
  getTrackingStatus,
  retryFailedGeneration,
  retryAllFailedGenerations,
} from '@/lib/actions/tracking';
import {
  useSSE,
  type GenerationStatusEvent,
} from '@/components/providers/sse-provider';
import { toast } from 'sonner';
import { notifyPassBalanceChanged } from '@/lib/pass-events';

const STATUS_CONFIG: Record<
  TrackingItem['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: 'Pending',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
  },
  generating: {
    label: 'Generating',
    variant: 'default',
    icon: <Zap className="h-3 w-3" />,
  },
  ready: {
    label: 'Ready',
    variant: 'secondary',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  untracked: {
    label: 'Untracked',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
  },
};

export default function GenerationQueueCard({
  initialItems,
  className,
}: {
  initialItems: TrackingItem[];
  className?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const { subscribe } = useSSE();

  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    generating: items.filter((i) => i.status === 'generating').length,
    ready: items.filter((i) => i.status === 'ready').length,
    failed: items.filter((i) => i.status === 'failed').length,
  };

  const nonReadyItems = items.filter((i) => i.status !== 'ready');

  const refreshStatus = useCallback(() => {
    startTransition(async () => {
      const updated = await getTrackingStatus();
      setItems(updated);
    });
  }, []);

  // Subscribe to SSE generation:status events instead of polling
  useEffect(() => {
    return subscribe('generation:status', (event) => {
      const e = event as GenerationStatusEvent;

      setItems((prev) => {
        const idx = prev.findIndex((i) => i.chunkId === e.chunkId);
        if (idx === -1) {
          // New chunk we don't know about yet — do a full refresh
          startTransition(async () => {
            const updated = await getTrackingStatus();
            setItems(updated);
          });
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: e.status,
          errorMessage: e.errorMessage ?? null,
        };
        return updated;
      });

      // Trigger a server-side balance refresh (e.newBalance is raw USD,
      // not a pass count — let PassBalanceChip fetch the correct value)
      if (e.status === 'ready') {
        notifyPassBalanceChanged();
      }
    });
  }, [subscribe]);

  const handleRetry = (chunkId: string) => {
    setRetryingIds((prev) => new Set(prev).add(chunkId));
    startTransition(async () => {
      try {
        const result = await retryFailedGeneration(chunkId);
        if (result.status === 'error') {
          toast.error(result.message);
          return;
        }
        // Mark as pending immediately — SSE will update when ready
        setItems((prev) =>
          prev.map((i) =>
            i.chunkId === chunkId
              ? { ...i, status: 'pending' as const, errorMessage: null }
              : i
          )
        );
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(chunkId);
          return next;
        });
      }
    });
  };

  const handleRetryAll = () => {
    startTransition(async () => {
      const result = await retryAllFailedGenerations();
      if (result.status === 'error') {
        toast.error(result.message);
        return;
      }
      // Mark all failed as pending — SSE will update as each finishes
      setItems((prev) =>
        prev.map((i) =>
          i.status === 'failed'
            ? { ...i, status: 'pending' as const, errorMessage: null }
            : i
        )
      );
    });
  };

  if (items.length === 0) {
    return (
      <Card
        className={cn(
          'min-h-0 max-h-[320px] overflow-hidden col-span-2 bg-primary/5 rounded-[2rem]',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Question Generation
          </CardTitle>
          <CardDescription>Getting Started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              No chunks are being tracked yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Navigate to a topic, note, or chunk and click{' '}
              <span className="font-medium">&ldquo;Track&rdquo;</span> to start
              generating recall questions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={cn(
          'min-h-0 max-h-[320px] overflow-hidden col-span-2 bg-primary/5 rounded-[2rem]',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Question Generation
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            {counts.failed > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetryAll()}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Retry All Failed
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </CardAction>
          <CardDescription>
            <div className="flex gap-3 mt-1">
              {counts.pending > 0 && (
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {counts.pending} pending
                </span>
              )}
              {counts.generating > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Zap className="h-3 w-3" />
                  {counts.generating} generating
                </span>
              )}
              {counts.ready > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  {counts.ready} ready
                </span>
              )}
              {counts.failed > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {counts.failed} failed
                </span>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        {nonReadyItems.length > 0 && (
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chunk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-center">Retries</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonReadyItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const isRetrying = retryingIds.has(item.chunkId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {item.chunkName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.errorMessage ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-destructive max-w-[200px] truncate block cursor-help">
                                  {item.errorMessage}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-sm break-words"
                              >
                                {item.errorMessage}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-muted-foreground">
                          {item.retryCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(item.chunkId)}
                            disabled={isPending || isRetrying}
                          >
                            {isRetrying ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {(item.status === 'pending' ||
                          item.status === 'generating') && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </>
  );
}
