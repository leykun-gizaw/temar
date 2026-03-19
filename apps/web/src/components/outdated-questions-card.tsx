'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RefreshCw,
  AlertTriangle,
  FileEdit,
  Loader2,
  SquareArrowOutUpRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { OutdatedChunk } from '@/lib/actions/tracking';
import { regenerateChunkQuestions } from '@/lib/actions/tracking';
import { cn } from '@/lib/utils';
import { notifyPassBalanceChanged } from '@/lib/pass-events';
import Link from 'next/link';

export default function OutdatedQuestionsCard({
  initialChunks,
  className,
}: {
  initialChunks: OutdatedChunk[];
  className?: string;
}) {
  const [chunks, setChunks] = useState(initialChunks);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(
    new Set()
  );
  const [isPending, startTransition] = useTransition();
  const [passError, setPassError] = useState<string | null>(null);
  const [consentState, setConsentState] = useState<{
    estimatedPassCost: number;
    basePassCost: number;
    onApprove: (cost: number) => void;
  } | null>(null);

  if (chunks.length === 0) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-green-500" />
            Outdated Chunks
          </CardTitle>
          <CardDescription className="text-xs">
            No outdated chunks found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-xs border border-dashed h-full flex flex-col gap-2 items-center justify-center p-8 text-center text-muted-foreground">
            <p>No chunks outdated or associated recall items outdated</p>
            <span className="text-center">
              To learn more about outdated chunks and retired recall items,{' '}
              <Link
                href="https://temar.leyk14.com/docs/tracking#outdated-chunks"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary"
              >
                click here
                <SquareArrowOutUpRight
                  className="inline align-middle"
                  size={12}
                />
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRegenerate = (chunkId: string, consentedPassCost?: number) => {
    setRegeneratingIds((prev) => new Set(prev).add(chunkId));
    startTransition(async () => {
      try {
        const result = await regenerateChunkQuestions(
          chunkId,
          consentedPassCost
        );
        if (result.status === 'success') {
          setChunks((prev) => prev.filter((c) => c.chunkId !== chunkId));
          if (result.newBalance != null)
            notifyPassBalanceChanged(result.newBalance);
        } else if (result.status === 'consent_required') {
          setConsentState({
            estimatedPassCost: result.estimatedPassCost,
            basePassCost: result.basePassCost,
            onApprove: (cost) => handleRegenerate(chunkId, cost),
          });
        } else if (result.status === 'insufficient_pass') {
          setPassError(
            `Not enough Pass (have ${result.balance}, need ${result.required}).`
          );
        } else if (result.status === 'error') {
          setPassError(result.message);
        }
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(chunkId);
          return next;
        });
      }
    });
  };

  const handleRegenerateAll = () => {
    for (const c of chunks) {
      handleRegenerate(c.chunkId);
    }
  };

  return (
    <>
      <Card className={cn('shadow-sm flex flex-col', className)}>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Outdated Chunks
          </CardTitle>
          <CardDescription className="text-xs">
            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''} need
            {chunks.length === 1 ? 's' : ''} user attention
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto flex flex-col gap-2">
          {chunks.map((c) => {
            const isRegenerating = regeneratingIds.has(c.chunkId);
            return (
              <div
                key={c.chunkId}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.chunkName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.topicName} &gt; {c.noteName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={
                            c.reason === 'content_changed'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-[10px] cursor-help"
                        >
                          {c.reason === 'content_changed' ? (
                            <FileEdit className="h-3 w-3 mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          {c.reason === 'content_changed'
                            ? 'Changed'
                            : 'Retired'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-xs">
                        {c.reason === 'content_changed'
                          ? 'Content was updated since questions were generated.'
                          : `All ${c.retiredCount} question${
                              c.retiredCount !== 1 ? 's' : ''
                            } have been retired after reaching the review limit.`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={isRegenerating}
                    onClick={() => handleRegenerate(c.chunkId)}
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="border-t">
          {chunks.length > 1 && (
            <Button
              variant="outline"
              className="w-full text-xs"
              disabled={isPending}
              onClick={handleRegenerateAll}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Regenerate All
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Pass consent dialog */}
      <Dialog
        open={!!consentState}
        onOpenChange={(open) => {
          if (!open) setConsentState(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extra Pass required</DialogTitle>
            <DialogDescription>
              This content exceeds the standard token budget. Regeneration will
              cost <strong>{consentState?.estimatedPassCost} Pass</strong>{' '}
              instead of the base {consentState?.basePassCost} Pass.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentState(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                consentState?.onApprove(consentState.estimatedPassCost);
                setConsentState(null);
              }}
            >
              Approve &amp; Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass error dialog */}
      <Dialog
        open={!!passError}
        onOpenChange={(open) => {
          if (!open) setPassError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Not enough Pass</DialogTitle>
            <DialogDescription>
              {passError} Top up at billing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassError(null)}>
              Close
            </Button>
            <Button asChild>
              <a href="/dashboard/billing">Top up Pass</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
