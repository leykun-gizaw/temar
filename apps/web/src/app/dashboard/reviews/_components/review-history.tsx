'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  RecallItemDue,
  ReviewLogEntry,
  AnswerRubric,
} from '@/lib/fetchers/recall-items';
import type { AnalysisResult } from '@/lib/actions/analysis';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import type { SerializedEditorState } from 'lexical';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ReviewAnalysis } from './review-analysis';
import { ReviewRubricDisplay } from './review-rubric';
import { RotateCcw, CheckCircle2, Clock, History } from 'lucide-react';

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
  completedCount?: number;
}

export default function ReviewHistory({
  allItems,
  topics,
  currentTopicId,
  completedCount = 0,
}: ReviewHistoryProps) {
  const router = useRouter();
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

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

  // Filter by topic
  const filteredChunks = currentTopicId
    ? chunks.filter((c) => c.items[0]?.topicId === currentTopicId)
    : chunks;

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
    <div className="grid grid-rows-[auto_1fr] h-[calc(100vh-var(--header-height))]">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Review History</span>
          </div>
          {completedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fsrs-good-bg text-fsrs-good font-medium flex items-center gap-1">
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
            <SelectTrigger className="h-7 w-[200px] text-xs">
              <SelectValue placeholder="Filter" />
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => router.refresh()}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Check for due items
          </Button>
        </div>
      </div>

      {/* ── Main grid: three-column layout ── */}
      <div className="grid grid-cols-[280px_1px_1fr_1px_1fr] min-h-0">
        {/* ──── LEFT PANEL: Chunk list + Item list ──── */}
        <div className="flex flex-col min-h-0">
          {/* Chunk selector */}
          <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
            <Select
              value={selectedChunkId ?? ''}
              onValueChange={(v) => {
                setSelectedChunkId(v);
                setSelectedItemId(null);
              }}
            >
              <SelectTrigger className="h-7 text-xs w-full">
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
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {selectedChunk.topicName} &gt; {selectedChunk.noteName}
              </p>
            )}
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto">
            {chunkItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full text-left px-3 py-2.5 border-b transition-colors hover:bg-muted/50 ${
                  item.id === selectedItemId ? 'bg-muted' : ''
                }`}
              >
                <p className="text-xs font-medium truncate">
                  {item.questionTitle || item.chunkName}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {item.questionText || 'No question text'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
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

        {/* Divider */}
        <div className="bg-border" />

        {/* ──── MIDDLE PANEL: Question + Rubric + Key Points ──── */}
        <div className="overflow-y-auto p-5">
          {selectedItem ? (
            <div className="space-y-5">
              {selectedItem.questionTitle && (
                <h2 className="text-lg font-semibold">
                  {selectedItem.questionTitle}
                </h2>
              )}
              {selectedItem.questionText ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="font-medium leading-relaxed">
                    {selectedItem.questionText}
                  </p>
                </div>
              ) : selectedItem.chunkContentMd ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {selectedItem.chunkContentMd}
                  </Markdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No question content available
                </p>
              )}

              <hr />

              {/* Type-specific rubric */}
              <ReviewRubricDisplay rubric={rubric} isHistoryView />

              {/* Key Points */}
              {rubric?.keyPoints && rubric.keyPoints.length > 0 && (
                <>
                  <hr />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
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
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select an item to view details
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="bg-border" />

        {/* ──── RIGHT PANEL: Review log selector + Answer + Analysis ──── */}
        <div className="flex flex-col min-h-0">
          {/* Review log tabs */}
          <div className="flex items-center gap-0 border-b shrink-0 px-1 bg-muted/30 overflow-x-auto">
            {reviewLogs.length > 0 ? (
              reviewLogs.map((log, idx) => {
                const ratingInfo = RATING_LABELS[log.rating] ?? {
                  label: '?',
                  color: '',
                };
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                      log.id === selectedLogId
                        ? 'border-primary text-foreground font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      #{reviewLogs.length - idx}
                    </span>
                    <span className={ratingInfo.color}>{ratingInfo.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(log.reviewedAt)}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="px-3 py-2 text-xs text-muted-foreground">
                {isLoadingLogs ? 'Loading...' : 'No review logs'}
              </span>
            )}
          </div>

          {/* Review log content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedLog ? (
              <div className="space-y-5">
                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(selectedLog.durationMs)}
                  </span>
                  <span>Reviewed: {formatDate(selectedLog.reviewedAt)}</span>
                  <span>
                    Rating:{' '}
                    <span
                      className={`font-medium ${
                        RATING_LABELS[selectedLog.rating]?.color ?? ''
                      }`}
                    >
                      {RATING_LABELS[selectedLog.rating]?.label ??
                        selectedLog.rating}
                    </span>
                  </span>
                </div>

                {/* Answer as markdown */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Your Answer
                  </h3>
                  {answerMarkdown ? (
                    <div className="prose prose-sm text-sm/6 dark:prose-invert max-w-none rounded-md border p-4 bg-muted/20">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {answerMarkdown}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No answer recorded for this review.
                    </p>
                  )}
                </div>

                {/* Analysis results */}
                {analysis && <ReviewAnalysis analysis={analysis} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <History className="h-5 w-5 opacity-40" />
                <p className="text-xs">
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
