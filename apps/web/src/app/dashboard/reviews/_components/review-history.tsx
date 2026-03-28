'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@temar/ui';
import type {
  RecallItemDue,
  ReviewLogEntry,
  AnswerRubric,
} from '@/lib/fetchers/recall-items';
import type { AnalysisResult } from '@/lib/actions/analysis';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import type { SerializedEditorState } from 'lexical';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ReviewAnalysis } from './review-analysis';
import { ReviewRubricDisplay } from './review-rubric';
import { RotateCcw, CheckCircle2, Clock, History, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Again', color: 'text-fsrs-again' },
  2: { label: 'Hard', color: 'text-fsrs-hard' },
  3: { label: 'Good', color: 'text-fsrs-good' },
  4: { label: 'Easy', color: 'text-fsrs-easy' },
};

interface ReviewHistoryProps {
  allItems: RecallItemDue[];
  topics: Array<{ id: string; name: string }>;
  currentTopicId?: string;
  currentNoteId?: string;
  completedCount?: number;
}

export default function ReviewHistory({
  allItems,
  topics,
  currentTopicId,
  currentNoteId,
  completedCount = 0,
}: ReviewHistoryProps) {
  const router = useRouter();
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [filterNoteId, setFilterNoteId] = useState<string | null>(
    currentNoteId ?? null
  );

  // Derive unique notes from all items for note filter
  const noteOptions = useMemo(() => {
    const topicFiltered = currentTopicId
      ? allItems.filter((i) => i.topicId === currentTopicId)
      : allItems;
    const noteMap = new Map<string, string>();
    for (const item of topicFiltered) {
      if (!noteMap.has(item.noteId)) {
        noteMap.set(item.noteId, item.noteName);
      }
    }
    return Array.from(noteMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allItems, currentTopicId]);

  // Group items by chunk
  const chunkGroups = allItems.reduce<
    Map<
      string,
      {
        chunkName: string;
        noteName: string;
        topicName: string;
        items: RecallItemDue[];
      }
    >
  >((acc, item) => {
    if (!acc.has(item.chunkId)) {
      acc.set(item.chunkId, {
        chunkName: item.chunkName,
        noteName: item.noteName,
        topicName: item.topicName,
        items: [],
      });
    }
    acc.get(item.chunkId)?.items.push(item);
    return acc;
  }, new Map());

  const chunks = Array.from(chunkGroups.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  // Filter by topic and note
  const filteredChunks = chunks.filter((c) => {
    if (currentTopicId && c.items[0]?.topicId !== currentTopicId) return false;
    if (filterNoteId && c.items[0]?.noteId !== filterNoteId) return false;
    return true;
  });

  // Auto-select first chunk
  useEffect(() => {
    if (!selectedChunkId && filteredChunks.length > 0) {
      setSelectedChunkId(filteredChunks[0].id);
    }
  }, [filteredChunks, selectedChunkId]);

  // Get items for selected chunk
  const selectedChunk = selectedChunkId
    ? chunkGroups.get(selectedChunkId)
    : null;
  const chunkItems = useMemo(() => selectedChunk?.items ?? [], [selectedChunk]);

  // Auto-select first item when chunk changes
  useEffect(() => {
    if (
      chunkItems.length > 0 &&
      (!selectedItemId || !chunkItems.find((i) => i.id === selectedItemId))
    ) {
      setSelectedItemId(chunkItems[0].id);
    }
  }, [chunkItems, selectedItemId]);

  const selectedItem = chunkItems.find((i) => i.id === selectedItemId) ?? null;

  // Fetch review logs when selected item changes
  const fetchLogs = useCallback(async (recallItemId: string) => {
    setIsLoadingLogs(true);
    setReviewLogs([]);
    setSelectedLogId(null);
    try {
      const res = await fetch(`/api/review-history/${recallItemId}`);
      if (res.ok) {
        const logs: ReviewLogEntry[] = await res.json();
        setReviewLogs(logs);
        if (logs.length > 0) setSelectedLogId(logs[0].id);
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      fetchLogs(selectedItemId);
    }
  }, [selectedItemId, fetchLogs]);

  const selectedLog = reviewLogs.find((l) => l.id === selectedLogId) ?? null;
  const analysis = selectedLog?.analysisJson as AnalysisResult | null;
  const answerMarkdown = selectedLog?.answerJson
    ? lexicalToMarkdown(selectedLog.answerJson as SerializedEditorState)
    : null;

  const rubric = selectedItem?.answerRubric as AnswerRubric | null;

  const handleScopeChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/reviews');
    } else {
      router.push(`/dashboard/reviews?topicId=${value}`);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-2 bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Review History
            </span>
          </div>
          {completedCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-fsrs-good-bg text-fsrs-good font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedCount} reviewed this session
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select
            defaultValue={currentTopicId ?? 'all'}
            onValueChange={handleScopeChange}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs rounded-full">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {noteOptions.length > 1 && (
            <Select
              value={filterNoteId ?? 'all'}
              onValueChange={(v) => {
                setFilterNoteId(v === 'all' ? null : v);
                setSelectedChunkId(null);
                setSelectedItemId(null);
              }}
            >
              <SelectTrigger className="h-7 w-[140px] text-xs rounded-full">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notes</SelectItem>
                {noteOptions.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-full"
            onClick={() => router.refresh()}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Check for due items
          </Button>
        </div>
      </div>

      {/* ── Main grid: three-column layout ── */}
      <div className="grid grid-cols-[280px_1fr_1fr] min-h-0">
        {/* ──── LEFT PANEL: Chunk list + Item list ──── */}
        <div className="flex flex-col min-h-0 bg-muted/20">
          {/* Chunk selector */}
          <div className="px-4 py-3 shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              Knowledge Hierarchy
            </p>
            <Select
              value={selectedChunkId ?? ''}
              onValueChange={(v) => {
                setSelectedChunkId(v);
                setSelectedItemId(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full rounded-xl bg-card shadow-sm">
                <SelectValue placeholder="Select chunk" />
              </SelectTrigger>
              <SelectContent>
                {filteredChunks.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="truncate">{c.chunkName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChunk && (
              <p className="text-[10px] text-muted-foreground mt-1.5 truncate font-medium">
                {selectedChunk.topicName} &gt; {selectedChunk.noteName}
              </p>
            )}
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto px-2">
            {chunkItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={cn(
                  'w-full text-left px-3 py-3 rounded-xl mb-1 transition-all',
                  item.id === selectedItemId
                    ? 'bg-card shadow-sm'
                    : 'hover:bg-muted/50'
                )}
              >
                <p className="text-xs font-semibold truncate">
                  {item.questionTitle || item.chunkName}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {item.questionText || 'No question text'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {item.reps} reviews
                  </span>
                  {item.lastReview && (
                    <span className="text-[10px] text-muted-foreground">
                      Last: {formatDate(item.lastReview)}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {chunkItems.length === 0 && (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No items in this chunk
              </div>
            )}
          </div>
        </div>

        {/* ──── MIDDLE PANEL: Question + Rubric + Key Points ──── */}
        <div className="overflow-y-auto p-8 lg:p-10">
          {selectedItem ? (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <span>{selectedChunk?.topicName}</span>
                <ChevronRight className="h-3 w-3" />
                <span>{selectedChunk?.noteName}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary">{selectedChunk?.chunkName}</span>
              </nav>

              {selectedItem.questionTitle && (
                <h2 className="text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight">
                  {selectedItem.questionTitle}
                </h2>
              )}
              {selectedItem.questionText ? (
                <MarkdownRenderer className="text-base font-medium leading-relaxed text-muted-foreground">
                  {selectedItem.questionText}
                </MarkdownRenderer>
              ) : selectedItem.chunkContentMd ? (
                <MarkdownRenderer>
                  {selectedItem.chunkContentMd}
                </MarkdownRenderer>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No question content available
                </p>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="p-5 bg-muted/40 rounded-2xl">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Stability
                  </p>
                  <p className="text-lg font-extrabold tabular-nums">
                    {selectedItem.stability != null
                      ? selectedItem.stability < 1
                        ? `${Math.round(selectedItem.stability * 24)}h`
                        : `${Math.round(selectedItem.stability)}d`
                      : '—'}
                  </p>
                </div>
                <div className="p-5 bg-muted/40 rounded-2xl">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Total Reviews
                  </p>
                  <p className="text-lg font-extrabold tabular-nums">
                    {selectedItem.reps ?? 0}
                  </p>
                </div>
              </div>

              {/* Type-specific rubric */}
              <ReviewRubricDisplay rubric={rubric} isHistoryView />

              {/* Key Points */}
              {rubric?.keyPoints && rubric.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Key Points
                  </h3>
                  <ul className="space-y-1.5">
                    {rubric.keyPoints.map((kp, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <History className="h-6 w-6 opacity-30" />
              </div>
              <p className="text-sm font-medium">
                Select an item to view details
              </p>
            </div>
          )}
        </div>

        {/* ──── RIGHT PANEL: Review log selector + Answer + Analysis ──── */}
        <div className="flex flex-col min-h-0 bg-muted/10">
          {/* Review log tabs — pill-style segmented control */}
          <div className="shrink-0 px-5 pt-4 pb-2">
            {reviewLogs.length > 0 ? (
              <div className="flex gap-1 bg-muted/50 p-1 rounded-full">
                {reviewLogs.map((log, idx) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={cn(
                        'flex-1 py-1.5 text-[11px] font-bold rounded-full transition-all whitespace-nowrap',
                        log.id === selectedLogId
                          ? 'bg-background shadow-md text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Attempt {reviewLogs.length - idx}
                    </button>
                  ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                {isLoadingLogs ? 'Loading...' : 'No review logs'}
              </span>
            )}
          </div>

          {/* Review log content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {selectedLog ? (
              <div className="space-y-6">
                {/* Meta info */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Your Answer
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium italic">
                    {formatDate(selectedLog.reviewedAt)}
                  </span>
                </div>

                {/* Answer as markdown */}
                {answerMarkdown ? (
                  <div className="rounded-xl p-5 bg-card shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-l-xl" />
                    <div className="pl-3">
                      <MarkdownRenderer>{answerMarkdown}</MarkdownRenderer>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No answer recorded for this review.
                  </p>
                )}

                {/* Meta badges */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    {formatDuration(selectedLog.durationMs)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full',
                      RATING_LABELS[selectedLog.rating]?.color ?? '',
                      selectedLog.rating === 1
                        ? 'bg-fsrs-again-bg'
                        : selectedLog.rating === 2
                        ? 'bg-fsrs-hard-bg'
                        : selectedLog.rating === 3
                        ? 'bg-fsrs-good-bg'
                        : 'bg-fsrs-easy-bg'
                    )}
                  >
                    {RATING_LABELS[selectedLog.rating]?.label ??
                      selectedLog.rating}
                  </span>
                </div>

                {/* Analysis results */}
                {analysis && <ReviewAnalysis analysis={analysis} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <History className="h-5 w-5 opacity-30" />
                </div>
                <p className="text-xs font-medium">
                  {isLoadingLogs
                    ? 'Loading review logs...'
                    : 'Select a review log to view details'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
