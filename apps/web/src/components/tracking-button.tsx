'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Loader2, ArrowBigDownDashIcon, Check } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  trackTopic,
  trackNote,
  trackChunk,
  trackChunksBatch,
  untrackTopic,
  untrackNote,
  untrackChunk,
  getCascadeInfo,
} from '@/lib/actions/tracking';
import type { CascadeInfo, ChunkTrackConfig } from '@/lib/actions/tracking';

const QUESTION_TYPES = [
  { id: 'open_ended', label: 'Open-ended', short: 'OE' },
  { id: 'mcq', label: 'Multiple choice', short: 'MCQ' },
  { id: 'leetcode', label: 'Algorithm', short: 'Algo' },
] as const;

interface TrackingButtonProps {
  entityType: 'topic' | 'note' | 'chunk';
  entityId: string;
  topicId?: string;
  noteId?: string;
  isTracked: boolean;
  compact?: boolean;
  contentLength?: number;
}

export default function TrackingButton({
  entityType,
  entityId,
  topicId,
  noteId,
  isTracked: initialTracked,
  compact = false,
  contentLength,
}: TrackingButtonProps) {
  const [tracked, setTracked] = useState(initialTracked);
  const [isPending, startTransition] = useTransition();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [errorIsPassInsufficient, setErrorIsPassInsufficient] = useState(false);

  const suggestedCount = Math.min(
    Math.max(Math.ceil((contentLength ?? 1500) / 500), 2),
    10
  );

  // Batch (shared) settings
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['open_ended']);
  const [questionCount, setQuestionCount] = useState(suggestedCount);

  // Cascade info for topic/note tracking
  const [cascadeInfo, setCascadeInfo] = useState<CascadeInfo | null>(null);
  const [loadingCascade, setLoadingCascade] = useState(false);

  // Per-chunk mode
  const [perChunkMode, setPerChunkMode] = useState(false);
  const [perChunkTypes, setPerChunkTypes] = useState<Record<string, string[]>>(
    {}
  );
  const [perChunkCounts, setPerChunkCounts] = useState<
    Record<string, number>
  >({});

  const isCascade = entityType !== 'chunk';

  // Initialize per-chunk defaults from batch settings when cascade info loads
  const initPerChunkDefaults = useCallback(
    (info: CascadeInfo) => {
      const types: Record<string, string[]> = {};
      const counts: Record<string, number> = {};
      for (const c of info.chunks) {
        if (!c.isTracked) {
          types[c.id] = [...selectedTypes];
          counts[c.id] = questionCount;
        }
      }
      setPerChunkTypes(types);
      setPerChunkCounts(counts);
    },
    [selectedTypes, questionCount]
  );

  // Fetch cascade info when popover opens for topic/note
  useEffect(() => {
    if (popoverOpen && !tracked && isCascade && !cascadeInfo) {
      setLoadingCascade(true);
      getCascadeInfo(entityType, entityId)
        .then((info) => {
          setCascadeInfo(info);
          initPerChunkDefaults(info);
        })
        .catch(() => setCascadeInfo(null))
        .finally(() => setLoadingCascade(false));
    }
    if (!popoverOpen) {
      setCascadeInfo(null);
      setPerChunkMode(false);
    }
  }, [popoverOpen, tracked, isCascade, entityType, entityId, cascadeInfo, initPerChunkDefaults]);

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  const togglePerChunkType = (chunkId: string, typeId: string) => {
    setPerChunkTypes((prev) => {
      const current = prev[chunkId] ?? ['open_ended'];
      const next = current.includes(typeId)
        ? current.filter((t) => t !== typeId)
        : [...current, typeId];
      return { ...prev, [chunkId]: next };
    });
  };

  const setPerChunkCount = (chunkId: string, count: number) => {
    setPerChunkCounts((prev) => ({ ...prev, [chunkId]: count }));
  };

  const handleResult = (result: { status: string; balance?: number; required?: number; message?: string }) => {
    if (result.status === 'success') {
      setTracked(true);
      setPopoverOpen(false);
      // Pass balance updates arrive via SSE when generation completes
    } else if (result.status === 'insufficient_pass') {
      setPopoverOpen(false);
      setErrorIsPassInsufficient(true);
      setPassError(
        `Not enough Pass (have ${result.balance}, need ${result.required}). Top up at /dashboard/billing.`
      );
    } else if (result.status === 'error') {
      setPopoverOpen(false);
      setErrorIsPassInsufficient(false);
      setPassError(result.message ?? 'Unknown error');
    }
  };

  const handleTrackConfirm = () => {
    const types = selectedTypes.length > 0 ? selectedTypes : undefined;
    const count = questionCount > 0 ? questionCount : undefined;

    startTransition(async () => {
      try {
        let result;
        if (perChunkMode && isCascade && cascadeInfo) {
          // Per-chunk: track each untracked chunk individually
          const configs: ChunkTrackConfig[] = cascadeInfo.chunks
            .filter((c) => !c.isTracked)
            .map((c) => ({
              chunkId: c.id,
              questionTypes:
                perChunkTypes[c.id]?.length > 0
                  ? perChunkTypes[c.id]
                  : ['open_ended'],
              questionCount: perChunkCounts[c.id] ?? suggestedCount,
            }));
          result = await trackChunksBatch(configs);
        } else if (entityType === 'topic') {
          result = await trackTopic(entityId, types, count);
        } else if (entityType === 'note') {
          result = await trackNote(entityId, topicId ?? '', types, count);
        } else {
          result = await trackChunk(
            entityId,
            noteId ?? '',
            topicId ?? '',
            types,
            count
          );
        }
        handleResult(result);
      } catch (err) {
        console.error('Track failed:', err);
      }
    });
  };

  const handleUntrack = () => {
    startTransition(async () => {
      try {
        if (entityType === 'topic') {
          await untrackTopic(entityId);
        } else if (entityType === 'note') {
          await untrackNote(entityId, topicId ?? '');
        } else {
          await untrackChunk(entityId, noteId ?? '', topicId ?? '');
        }
        setTracked(false);
        setPopoverOpen(false);
      } catch (err) {
        console.error('Untrack failed:', err);
      }
    });
  };

  const allAlreadyTracked = isCascade && cascadeInfo?.untracked === 0;
  const hasMixed =
    isCascade &&
    cascadeInfo != null &&
    cascadeInfo.tracked > 0 &&
    cascadeInfo.untracked > 0;
  const newChunks =
    cascadeInfo?.chunks.filter((c) => !c.isTracked) ?? [];
  // Don't show config sections until cascade info is loaded for topic/note
  const cascadeReady = !isCascade || (cascadeInfo != null && !loadingCascade);

  // Validate per-chunk: every new chunk needs at least one type
  const perChunkValid =
    !perChunkMode ||
    newChunks.every((c) => (perChunkTypes[c.id]?.length ?? 0) > 0);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={`inline-flex items-center gap-1 transition-colors cursor-pointer text-xs ${
              tracked
                ? 'text-primary hover:text-primary/70'
                : 'text-muted-foreground hover:text-primary'
            }`}
            title={tracked ? `Tracking ${entityType}` : `Track ${entityType}`}
          >
            {isPending ? (
              <Loader2 size={compact ? 14 : 16} className="animate-spin" />
            ) : (
              <ArrowBigDownDashIcon size={compact ? 16 : 18} />
            )}
            {!compact && (
              <span>{tracked ? 'Tracking' : 'Track'}</span>
            )}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className={isCascade ? 'w-80' : 'w-72'}
          align="end"
          sideOffset={8}
        >
          {tracked ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Tracking active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This {entityType} is being tracked for recall.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 rounded-xl text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive"
                onClick={handleUntrack}
                disabled={isPending}
              >
                {isPending && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                )}
                Untrack
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Track for recall</p>

              {/* Cascade info section for topic/note */}
              {isCascade && (
                <>
                  {loadingCascade ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Scanning chunks...
                      </span>
                    </div>
                  ) : cascadeInfo ? (
                    <div className="space-y-2">
                      {/* Summary badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[0.6rem] px-1.5 py-0 font-normal"
                        >
                          {cascadeInfo.total} chunk
                          {cascadeInfo.total !== 1 ? 's' : ''}
                        </Badge>
                        {cascadeInfo.tracked > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[0.6rem] px-1.5 py-0 font-normal text-emerald-600 border-emerald-300/50"
                          >
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            {cascadeInfo.tracked} tracked
                          </Badge>
                        )}
                        {cascadeInfo.untracked > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[0.6rem] px-1.5 py-0 font-normal text-amber-600 border-amber-300/50"
                          >
                            {cascadeInfo.untracked} new
                          </Badge>
                        )}
                      </div>

                      {allAlreadyTracked && (
                        <p className="text-xs text-muted-foreground">
                          All chunks in this {entityType} are already tracked.
                        </p>
                      )}

                      {/* Mode toggle — only when there are new chunks */}
                      {!allAlreadyTracked && newChunks.length > 1 && (
                        <div className="flex rounded-lg bg-muted p-0.5">
                          <button
                            type="button"
                            className={`flex-1 text-[0.65rem] py-1 rounded-md transition-colors ${
                              !perChunkMode
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => setPerChunkMode(false)}
                          >
                            Same for all
                          </button>
                          <button
                            type="button"
                            className={`flex-1 text-[0.65rem] py-1 rounded-md transition-colors ${
                              perChunkMode
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => {
                              setPerChunkMode(true);
                              if (cascadeInfo) initPerChunkDefaults(cascadeInfo);
                            }}
                          >
                            Per chunk
                          </button>
                        </div>
                      )}

                      {hasMixed && !perChunkMode && (
                        <p className="text-[0.6rem] text-muted-foreground">
                          Tracked chunks keep their existing questions.
                        </p>
                      )}

                      <Separator className="my-1" />
                    </div>
                  ) : null}
                </>
              )}

              {/* ── Batch mode (shared types for all new chunks) ── */}
              {cascadeReady && !allAlreadyTracked && !perChunkMode && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Question types
                    </Label>
                    {QUESTION_TYPES.map((type) => (
                      <div key={type.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`qtype-${type.id}`}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={() => toggleType(type.id)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`qtype-${type.id}`}
                          className="text-xs font-medium cursor-pointer"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="question-count"
                      className="text-xs font-medium"
                    >
                      Questions per chunk
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="question-count"
                        type="number"
                        min={1}
                        max={20}
                        value={questionCount}
                        onChange={(e) =>
                          setQuestionCount(
                            Math.max(
                              1,
                              Math.min(20, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-16 h-7 text-xs rounded-xl"
                      />
                      <span className="text-[0.65rem] text-muted-foreground">
                        Suggested: {suggestedCount}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ── Per-chunk mode ── */}
              {cascadeReady && !allAlreadyTracked && perChunkMode && (
                <ScrollArea className="max-h-52">
                  <div className="space-y-2.5 pr-3">
                    {newChunks.map((c) => (
                      <div key={c.id} className="space-y-1">
                        <p className="text-[0.7rem] font-medium truncate">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {QUESTION_TYPES.map((type) => {
                            const active =
                              perChunkTypes[c.id]?.includes(type.id) ?? false;
                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() =>
                                  togglePerChunkType(c.id, type.id)
                                }
                                className={`text-[0.6rem] px-1.5 py-0.5 rounded-md border transition-colors ${
                                  active
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'bg-transparent border-border text-muted-foreground hover:border-primary/20'
                                }`}
                              >
                                {type.short}
                              </button>
                            );
                          })}
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={perChunkCounts[c.id] ?? suggestedCount}
                            onChange={(e) =>
                              setPerChunkCount(
                                c.id,
                                Math.max(
                                  1,
                                  Math.min(
                                    20,
                                    parseInt(e.target.value) || 1
                                  )
                                )
                              )
                            }
                            className="w-11 h-5 text-[0.6rem] px-1.5 rounded-md ml-auto"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Action buttons */}
              {cascadeReady && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 rounded-xl text-xs"
                  onClick={() => setPopoverOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                {!allAlreadyTracked && (
                  <Button
                    size="sm"
                    className="flex-1 h-7 rounded-xl text-xs"
                    onClick={handleTrackConfirm}
                    disabled={
                      isPending ||
                      (!perChunkMode && selectedTypes.length === 0) ||
                      (perChunkMode && !perChunkValid) ||
                      (isCascade && loadingCascade)
                    }
                  >
                    {isPending && (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    )}
                    {isCascade && cascadeInfo
                      ? `Track ${cascadeInfo.untracked} chunk${cascadeInfo.untracked !== 1 ? 's' : ''}`
                      : 'Track & Generate'}
                  </Button>
                )}
              </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Error dialog — contextual title based on error type */}
      <Dialog
        open={!!passError}
        onOpenChange={(open) => {
          if (!open) setPassError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {errorIsPassInsufficient
                ? 'Not enough Pass'
                : 'Generation failed'}
            </DialogTitle>
            <DialogDescription>{passError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassError(null)}>
              Close
            </Button>
            {errorIsPassInsufficient && (
              <Button asChild>
                <a href="/dashboard/billing">Top up Pass</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
