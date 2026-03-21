'use client';

import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { submitReview, saveAnswerDraft } from '@/lib/actions/review';
import {
  analyzeAnswer,
  type AnalysisResult,
  type AnalyzeAnswerResult,
} from '@/lib/actions/analysis';
import type { RecallItemDue, AnswerRubric } from '@/lib/fetchers/recall-items';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ReviewAnalysis } from './review-analysis';
import { ReviewRubricDisplay } from './review-rubric';
import {
  Brain,
  CheckCircle2,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Send,
  RefreshCw,
  RotateCcw,
  Frown,
  Smile,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import AnswerEditor from '@/components/lexical-editor/AnswerEditor';
import type { SerializedEditorState } from 'lexical';
import {
  lexicalToMarkdown,
  lexicalToPlainText,
} from '@/components/lexical-editor/utils/serialize';
import { cn } from '@/lib/utils';
import { notifyPassBalanceChanged } from '@/lib/pass-events';

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const RATING_CONFIG: {
  rating: number;
  label: string;
  tooltip: string;
  shortcut: string;
  Icon: LucideIcon;
  color: { bg: string; text: string; hoverBg: string };
}[] = [
  {
    rating: 1,
    label: 'Again',
    tooltip:
      "You couldn't recall the answer — this card will be shown again soon",
    shortcut: '1',
    Icon: RotateCcw,
    color: {
      bg: 'bg-fsrs-again-bg',
      text: 'text-fsrs-again',
      hoverBg: 'hover:bg-fsrs-again-bg/60',
    },
  },
  {
    rating: 2,
    label: 'Hard',
    tooltip: 'You recalled with significant difficulty — shorter interval',
    shortcut: '2',
    Icon: Frown,
    color: {
      bg: 'bg-fsrs-hard-bg',
      text: 'text-fsrs-hard',
      hoverBg: 'hover:bg-fsrs-hard-bg/60',
    },
  },
  {
    rating: 3,
    label: 'Good',
    tooltip: 'You recalled correctly after some thought — normal interval',
    shortcut: '3',
    Icon: Smile,
    color: {
      bg: 'bg-fsrs-good-bg',
      text: 'text-fsrs-good',
      hoverBg: 'hover:bg-fsrs-good-bg/60',
    },
  },
  {
    rating: 4,
    label: 'Easy',
    tooltip: 'You recalled instantly and effortlessly — longer interval',
    shortcut: '4',
    Icon: Rocket,
    color: {
      bg: 'bg-fsrs-easy-bg',
      text: 'text-fsrs-easy',
      hoverBg: 'hover:bg-fsrs-easy-bg/60',
    },
  },
];

interface ReviewSessionProps {
  initialItems: RecallItemDue[];
  initialDrafts?: Record<string, unknown>;
  topics: Array<{ id: string; name: string }>;
  currentTopicId?: string;
  currentNoteId?: string;
  dueCount: number;
}

export default function ReviewSession({
  initialItems,
  initialDrafts,
  topics,
  currentTopicId,
  dueCount,
}: ReviewSessionProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now());
  const [isPending, startTransition] = useTransition();
  const [completedCount, setCompletedCount] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const STORAGE_KEY = 'temar:review-answers';
  const answersRef = useRef<Map<string, SerializedEditorState>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const resultsPanelRef = useRef<PanelImperativeHandle>(null);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track which items have been submitted (answer saved to DB)
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  // Track if editor has changed since last submit
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  // Hydrate answersRef from DB drafts first, then overlay localStorage
  useEffect(() => {
    // Load DB-persisted drafts (source of truth)
    if (initialDrafts) {
      const alreadySubmitted = new Set<string>();
      for (const [id, value] of Object.entries(initialDrafts)) {
        if (value) {
          answersRef.current.set(id, value as SerializedEditorState);
          alreadySubmitted.add(id);
        }
      }
      setSubmittedIds(alreadySubmitted);
    }
    // Overlay with localStorage (may have newer unsaved edits)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, SerializedEditorState>;
        for (const [id, value] of Object.entries(parsed)) {
          answersRef.current.set(id, value);
          // If localStorage has content for a submitted item, mark it dirty
          if (initialDrafts?.[id]) {
            setDirtyIds((prev) => new Set(prev).add(id));
          }
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistToLocalStorage = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const obj: Record<string, SerializedEditorState> = {};
        answersRef.current.forEach((v, k) => {
          obj[k] = v;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        // Ignore storage errors
      }
    }, 1000);
  }, []);

  const removeFromLocalStorage = useCallback((itemId: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, SerializedEditorState>;
        delete parsed[itemId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // silently ignore
    }
  }, []);

  const currentItem = items[currentIndex];
  const isSessionComplete = !currentItem;

  const handleScopeChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/reviews');
    } else {
      router.push(`/dashboard/reviews?topicId=${value}`);
    }
  };

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setCurrentIndex(index);
      if (!reviewedIds.has(items[index].id)) {
        setReviewStartTime(Date.now());
      }
    },
    [items, reviewedIds]
  );

  const handlePrev = () => navigateTo(currentIndex - 1);
  const handleNext = () => navigateTo(currentIndex + 1);

  const advanceAfterReview = useCallback(() => {
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (!reviewedIds.has(items[i].id)) {
        setCurrentIndex(i);
        setReviewStartTime(Date.now());
        return;
      }
    }
    for (let i = 0; i < currentIndex; i++) {
      if (!reviewedIds.has(items[i].id)) {
        setCurrentIndex(i);
        setReviewStartTime(Date.now());
        return;
      }
    }
    setItems([]);
    setCurrentIndex(0);
  }, [currentIndex, items, reviewedIds]);

  const handleSubmitAnswer = async () => {
    if (!currentItem) return;
    const answer = answersRef.current.get(currentItem.id);
    if (!answer) return;

    setIsSubmitting(true);
    try {
      await saveAnswerDraft(currentItem.id, answer);
      setSubmittedIds((prev) => new Set(prev).add(currentItem.id));
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(currentItem.id);
        return next;
      });
      // Clear from localStorage since it's now in DB
      removeFromLocalStorage(currentItem.id);
    } catch (err) {
      console.error('Failed to save answer draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentItem) return;
    const answer = answersRef.current.get(currentItem.id);
    if (!answer) return;

    const rubric = currentItem.answerRubric as AnswerRubric | null;
    if (!rubric) return;

    // Extract criteria and keyPoints from any rubric type
    let criteria: string[] = [];
    let keyPoints: string[] = [];

    if (rubric.type === 'open_ended') {
      criteria = rubric.criteria ?? [];
      keyPoints = rubric.keyPoints ?? [];
    } else if (rubric.type === 'mcq') {
      criteria = rubric.choices.map((c) => `${c.label}. ${c.text}`);
      keyPoints = rubric.keyPoints ?? [];
    } else if (rubric.type === 'leetcode') {
      criteria = [
        `Function: ${rubric.functionPrototype}`,
        ...rubric.constraints.map((c) => `Constraint: ${c}`),
      ];
      keyPoints = rubric.keyPoints ?? [];
    } else {
      // Legacy rubric without type field
      const legacy = rubric as { criteria?: string[]; keyPoints?: string[] };
      criteria = legacy.criteria ?? [];
      keyPoints = legacy.keyPoints ?? [];
    }

    if (!keyPoints.length) return;

    // Use markdown for analysis — preserves code blocks, formatting, structure
    const answerMd = lexicalToMarkdown(answer);
    // Also get plain text to check for empty answers
    const plainText = lexicalToPlainText(answer);

    if (!plainText && !answerMd.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const result: AnalyzeAnswerResult = await analyzeAnswer(
        answerMd || plainText,
        currentItem.questionTitle ?? '',
        currentItem.questionText ?? '',
        criteria,
        keyPoints
      );
      if (result.status === 'success') {
        setAnalysis(result.data);
        notifyPassBalanceChanged();
      } else if (result.status === 'insufficient_pass') {
        setAnalysisError(
          `Not enough Pass (have ${result.balance}, need ${result.required}). Top up in billing.`
        );
      } else {
        setAnalysisError(result.message);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRate = (rating: number) => {
    if (!currentItem) return;
    const durationMs = Date.now() - reviewStartTime;
    const answer = answersRef.current.get(currentItem.id);

    startTransition(async () => {
      try {
        await submitReview(
          currentItem.id,
          rating,
          durationMs,
          answer ?? undefined,
          analysis ?? undefined
        );
        removeFromLocalStorage(currentItem.id);
        answersRef.current.delete(currentItem.id);
        // Clear draft from DB (fire-and-forget)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        saveAnswerDraft(currentItem.id, null).catch(() => {});
        setCompletedCount((c) => c + 1);
        setReviewedIds((prev) => new Set(prev).add(currentItem.id));
        setSubmittedIds((prev) => {
          const next = new Set(prev);
          next.delete(currentItem.id);
          return next;
        });
        setAnalysis(null);
        setAnalysisError(null);
        advanceAfterReview();
      } catch (err) {
        console.error('Review submission failed:', err);
      }
    });
  };

  const handleSkip = () => {
    if (currentIndex + 1 < items.length) {
      navigateTo(currentIndex + 1);
    } else {
      navigateTo(0);
    }
  };

  useEffect(() => {
    if (isSessionComplete) {
      // Refresh the page to trigger the server component which will
      // show ReviewHistory when no due items remain
      router.refresh();
    }
  }, [isSessionComplete, router]);

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="w-20 h-20 rounded-full bg-fsrs-good-bg flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-fsrs-good" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Session Complete
          </h2>
          <p className="text-muted-foreground text-sm">
            {completedCount > 0
              ? `You reviewed ${completedCount} item${
                  completedCount !== 1 ? 's' : ''
                }. Redirecting to history...`
              : 'No items due for review right now.'}
          </p>
        </div>
      </div>
    );
  }

  const rubric = currentItem.answerRubric as AnswerRubric | null;
  const isCurrentReviewed = reviewedIds.has(currentItem.id);

  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-2 bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-full p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isPending}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground px-1.5">
              {currentIndex + 1}/{items.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1 || isPending}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[300px]">
            {currentItem.topicName} &gt; {currentItem.noteName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 font-bold text-muted-foreground">
            {STATE_LABELS[currentItem.state] ?? 'Unknown'}
          </span>
          {isCurrentReviewed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-fsrs-good-bg text-fsrs-good font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select
            defaultValue={currentTopicId ?? 'all'}
            onValueChange={handleScopeChange}
          >
            <SelectTrigger className="h-7 w-[180px] text-xs rounded-full">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-full text-xs font-bold text-muted-foreground">
            <Brain className="h-3.5 w-3.5" />
            <span>
              {completedCount}/{dueCount}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-full"
            onClick={handleSkip}
            disabled={isPending}
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
        </div>
      </div>

      {/* ── Main: resizable two-column layout with card gaps ── */}
      <div className="p-4 min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* ──── LEFT PANEL: Question + Rubric ──── */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="h-full p-1">
              <div className="h-full rounded-2xl bg-card shadow-md overflow-hidden">
                <div className="overflow-y-auto h-full p-8 lg:p-10">
                  <div className="space-y-8">
                    {/* Due Today badge */}
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground animate-pulse" />
                      Due Today
                    </span>

                    {currentItem.questionTitle && (
                      <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
                        {currentItem.questionTitle}
                      </h2>
                    )}
                    {currentItem.questionText ? (
                      <p className="text-lg lg:text-xl font-semibold leading-relaxed text-muted-foreground">
                        {currentItem.questionText}
                      </p>
                    ) : (
                      <div className="rounded-2xl p-5 bg-muted/30">
                        <p className="text-muted-foreground text-sm italic">
                          No question generated yet. Showing content as
                          reference:
                        </p>
                        {currentItem.chunkContentMd ? (
                          <MarkdownRenderer className="mt-3">
                            {currentItem.chunkContentMd}
                          </MarkdownRenderer>
                        ) : (
                          <p className="text-sm mt-2 font-medium">
                            {currentItem.chunkName}
                          </p>
                        )}
                      </div>
                    )}
                    {/* Type-specific rubric */}
                    <ReviewRubricDisplay rubric={rubric} />

                    {/* Metadata cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 p-5 rounded-xl">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                          Stability
                        </p>
                        <span className="text-xl font-extrabold text-primary tabular-nums">
                          {currentItem.stability != null
                            ? currentItem.stability < 1
                              ? `${Math.round(currentItem.stability * 24)}h`
                              : `${Math.round(currentItem.stability)}d`
                            : '—'}
                        </span>
                      </div>
                      <div className="bg-muted/40 p-5 rounded-xl">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                          Reviews
                        </p>
                        <span className="text-xl font-extrabold tabular-nums">
                          {currentItem.reps ?? 0}
                        </span>
                      </div>
                      <div className="bg-muted/40 p-5 rounded-xl col-span-2">
                        <div className="flex justify-between items-end mb-3">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Session Progress
                          </p>
                          <span className="text-xs font-bold tabular-nums">
                            {completedCount} / {items.length} Cards
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                items.length > 0
                                  ? (completedCount / items.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-3 bg-transparent after:hidden border-none group/handle flex items-center justify-center">
            <div className="w-1 h-8 rounded-full bg-border opacity-40 group-hover/handle:opacity-100 transition-opacity" />
          </ResizableHandle>

          {/* ──── RIGHT PANEL: Editor (top) + Results (bottom) ──── */}
          <ResizablePanel defaultSize={55} minSize={25}>
            <div className="h-full flex flex-col gap-2">
              <ResizablePanelGroup
                orientation="vertical"
                className="flex-1 min-h-0"
              >
                {/* Editor section */}
                <ResizablePanel defaultSize={70} minSize={20}>
                  <div className="h-full p-1">
                    <div className="flex flex-col h-full min-h-0 rounded-2xl bg-card shadow-md overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-2.5 shrink-0 bg-muted/20 rounded-t-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Your Answer
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-6 text-xs px-2.5 rounded-full',
                            submittedIds.has(currentItem.id) &&
                              !dirtyIds.has(currentItem.id)
                              ? 'bg-fsrs-good-bg text-fsrs-good border-fsrs-good/30'
                              : ''
                          )}
                          onClick={handleSubmitAnswer}
                          disabled={
                            isSubmitting ||
                            isPending ||
                            (submittedIds.has(currentItem.id) &&
                              !dirtyIds.has(currentItem.id))
                          }
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          {submittedIds.has(currentItem.id) &&
                          !dirtyIds.has(currentItem.id)
                            ? 'Submitted'
                            : 'Submit'}
                        </Button>
                      </div>
                      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <AnswerEditor
                          key={currentItem.id}
                          initialValue={answersRef.current.get(currentItem.id)}
                          onChange={(value) => {
                            answersRef.current.set(currentItem.id, value);
                            persistToLocalStorage();
                            if (submittedIds.has(currentItem.id)) {
                              setDirtyIds((prev) =>
                                new Set(prev).add(currentItem.id)
                              );
                            }
                          }}
                          placeholder="Write your answer here..."
                        />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle
                  className="bg-transparent border-none group/vhandle flex items-center justify-center"
                  style={{ height: 12, cursor: 'row-resize' }}
                >
                  <div
                    className="h-1 w-8 rounded-full bg-border opacity-40 group-hover/vhandle:opacity-100 transition-opacity"
                    style={{ transform: 'none' }}
                  />
                </ResizableHandle>

                {/* Results section — collapsible */}
                <ResizablePanel
                  panelRef={resultsPanelRef}
                  defaultSize={30}
                  minSize={10}
                  collapsible
                  collapsedSize={0}
                  onResize={(size) => {
                    setResultsCollapsed(size.asPercentage === 0);
                  }}
                >
                  <div className="h-full p-1">
                    <div className="flex flex-col h-full min-h-0 rounded-2xl bg-card shadow-md overflow-hidden">
                      <div className="flex items-center justify-between shrink-0 px-5 bg-muted/20 rounded-t-2xl">
                        <span className="flex items-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" />
                          Results
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => resultsPanelRef.current?.collapse()}
                          title="Minimize results"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {!analysis && !isAnalyzing && !analysisError && (
                          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                              <Sparkles className="h-5 w-5 opacity-50" />
                            </div>
                            <p className="text-xs font-medium">
                              {submittedIds.has(currentItem.id) &&
                              !dirtyIds.has(currentItem.id)
                                ? 'Click Analyze to get AI feedback'
                                : 'Submit your answer first, then analyze'}
                            </p>
                            <button
                              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full font-bold text-sm hover:bg-secondary/80 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:pointer-events-none"
                              onClick={handleAnalyze}
                              disabled={
                                isAnalyzing ||
                                isPending ||
                                !submittedIds.has(currentItem.id) ||
                                dirtyIds.has(currentItem.id)
                              }
                            >
                              {isAnalyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              Analyze Answer
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        )}
                        {isAnalyzing && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing your answer...
                          </div>
                        )}
                        {analysisError && (
                          <div className="flex flex-col items-center gap-2 py-3">
                            <p className="text-sm text-destructive text-center">
                              {analysisError}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleAnalyze}
                              disabled={isAnalyzing || isPending}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Retry Analysis
                            </Button>
                          </div>
                        )}
                        {analysis && (
                          <div className="space-y-3">
                            <ReviewAnalysis
                              analysis={analysis}
                              hideTitle
                              scoreSize="sm"
                            />

                            {rubric?.type === 'mcq' && (
                              <div className="border-t pt-3 mt-3">
                                <h4 className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1.5 uppercase tracking-wider">
                                  Correct Answer
                                </h4>
                                <p className="text-sm font-medium mb-2">
                                  {rubric.correctAnswer}.{' '}
                                  {
                                    rubric.choices.find(
                                      (c) => c.label === rubric.correctAnswer
                                    )?.text
                                  }
                                </p>
                                {rubric.explanation && (
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {rubric.explanation}
                                  </p>
                                )}
                              </div>
                            )}

                            {rubric?.keyPoints &&
                              rubric.keyPoints.length > 0 && (
                                <div className="border-t pt-3 mt-3">
                                  <h4 className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                                    Key Points
                                  </h4>
                                  <ul className="space-y-1">
                                    {rubric.keyPoints.map((kp, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-muted-foreground flex items-start gap-2"
                                      >
                                        <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                        {kp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Rating buttons — sticky footer inside results */}
                      <div className="shrink-0 px-4 py-2.5 bg-card/80 backdrop-blur-sm border-t border-border/30">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 text-center">
                          Rate your recall difficulty
                        </p>
                        <div className="grid grid-cols-4 gap-1 max-w-xs mx-auto">
                          <TooltipProvider delayDuration={200}>
                            {RATING_CONFIG.map(
                              ({
                                rating,
                                label,
                                tooltip,
                                shortcut,
                                Icon,
                                color,
                              }) => (
                                <Tooltip key={rating}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleRate(rating)}
                                      disabled={isPending}
                                      className={cn(
                                        'flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-all group disabled:opacity-50 disabled:pointer-events-none',
                                        color.hoverBg
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'w-9 h-9 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform',
                                          color.bg
                                        )}
                                      >
                                        <Icon
                                          className={cn('h-4 w-4', color.text)}
                                        />
                                      </div>
                                      <span className="text-[11px] font-bold">
                                        {label}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground font-medium">
                                        {shortcut}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">{tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            )}
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>

              {/* Collapsed results expand bar — inside right panel */}
              {resultsCollapsed && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-card rounded-2xl shadow-sm shrink-0">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Results
                    {analysis && (
                      <span
                        className={cn(
                          'ml-1 text-xs font-bold',
                          analysis.suggestedRating === 1
                            ? 'text-fsrs-again'
                            : analysis.suggestedRating === 2
                            ? 'text-fsrs-hard'
                            : analysis.suggestedRating === 3
                            ? 'text-fsrs-good'
                            : 'text-fsrs-easy'
                        )}
                      >
                        {analysis.scorePercent}%
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => resultsPanelRef.current?.expand()}
                    title="Expand results"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
