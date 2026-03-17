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
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const RATING_CONFIG = [
  {
    rating: 1,
    label: 'Again',
    tooltip:
      "You couldn't recall the answer — this card will be shown again soon",
    shortcut: '1',
    color: {
      bg: 'bg-fsrs-again-bg',
      text: 'text-fsrs-again',
    },
  },
  {
    rating: 2,
    label: 'Hard',
    tooltip: 'You recalled with significant difficulty — shorter interval',
    shortcut: '2',
    color: {
      bg: 'bg-fsrs-hard-bg',
      text: 'text-fsrs-hard',
    },
  },
  {
    rating: 3,
    label: 'Good',
    tooltip: 'You recalled correctly after some thought — normal interval',
    shortcut: '3',
    color: {
      bg: 'bg-fsrs-good-bg',
      text: 'text-fsrs-good',
    },
  },
  {
    rating: 4,
    label: 'Easy',
    tooltip: 'You recalled instantly and effortlessly — longer interval',
    shortcut: '4',
    color: {
      bg: 'bg-fsrs-easy-bg',
      text: 'text-fsrs-easy',
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
  type AnalyzeBaseArgs = [string, string, string, string[], string[]];
  const [analysisConsent, setAnalysisConsent] = useState<{
    estimatedPassCost: number;
    basePassCost: number;
    pendingArgs: AnalyzeBaseArgs;
  } | null>(null);
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
    setAnalysisConsent(null);

    const baseArgs: AnalyzeBaseArgs = [
      answerMd || plainText,
      currentItem.questionTitle ?? '',
      currentItem.questionText ?? '',
      criteria,
      keyPoints,
    ];

    try {
      const result: AnalyzeAnswerResult = await analyzeAnswer(...baseArgs);
      if (result.status === 'success') {
        setAnalysis(result.data);
        notifyPassBalanceChanged();
      } else if (result.status === 'consent_required') {
        setAnalysisConsent({
          estimatedPassCost: result.estimatedPassCost,
          basePassCost: result.basePassCost,
          pendingArgs: baseArgs,
        });
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

  const handleAnalysisConsentApprove = async () => {
    if (!analysisConsent) return;
    setAnalysisConsent(null);
    setIsAnalyzing(true);
    try {
      const [a, qt, qtext, crit, kp] = analysisConsent.pendingArgs;
      const result: AnalyzeAnswerResult = await analyzeAnswer(
        a,
        qt,
        qtext,
        crit,
        kp,
        analysisConsent.estimatedPassCost
      );
      if (result.status === 'success') {
        setAnalysis(result.data);
        notifyPassBalanceChanged();
      } else if (result.status === 'insufficient_pass') {
        setAnalysisError(
          `Not enough Pass (have ${result.balance}, need ${result.required}). Top up in billing.`
        );
      } else if (result.status === 'error') {
        setAnalysisError(result.message);
      }
    } catch (err) {
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

  if (isSessionComplete) {
    // Refresh the page to trigger the server component which will
    // show ReviewHistory when no due items remain
    router.refresh();
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <CheckCircle2 className="h-16 w-16 text-fsrs-good" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Session Complete</h2>
          <p className="text-muted-foreground">
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
    <div className="grid grid-rows-[auto_1fr_auto] h-[calc(100vh-var(--header-height))]">
      {/* ── Top bar ── */}
      <div className="flex items-center bg-primary/5 justify-between px-4 py-1.5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium tabular-nums text-muted-foreground px-1">
              {currentIndex + 1}/{items.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1 || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
            {currentItem.topicName} &gt; {currentItem.noteName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium">
            {STATE_LABELS[currentItem.state] ?? 'Unknown'}
          </span>
          {isCurrentReviewed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fsrs-good-bg text-fsrs-good font-medium flex items-center gap-1">
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
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Brain className="h-3.5 w-3.5" />
            <span>
              {completedCount}/{dueCount}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleSkip}
            disabled={isPending}
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
        </div>
      </div>

      {/* ── Main: resizable two-column layout ── */}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0">
        {/* ──── LEFT PANEL: Question + Rubric ──── */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="overflow-y-auto h-full p-5">
            <div className="space-y-5">
              {currentItem.questionTitle && (
                <h2 className="text-lg font-semibold">
                  {currentItem.questionTitle}
                </h2>
              )}
              {currentItem.questionText ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="font-medium leading-relaxed">
                    {currentItem.questionText}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <p className="text-muted-foreground text-sm italic">
                    No question generated yet. Showing content as reference:
                  </p>
                  {currentItem.chunkContentMd ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none mt-3">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {currentItem.chunkContentMd}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="text-sm mt-2 font-medium">
                      {currentItem.chunkName}
                    </p>
                  )}
                </div>
              )}

              <hr />

              {/* Type-specific rubric */}
              <ReviewRubricDisplay rubric={rubric} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ──── RIGHT PANEL: Editor (top) + Results (bottom) ──── */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <ResizablePanelGroup orientation="vertical">
            {/* Editor section */}
            <ResizablePanel defaultSize={70} minSize={20}>
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">
                    Your Answer
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-6 text-xs px-2.5',
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
                      // Mark dirty if this item was previously submitted
                      if (submittedIds.has(currentItem.id)) {
                        setDirtyIds((prev) => new Set(prev).add(currentItem.id));
                      }
                    }}
                    placeholder="Write your answer here..."
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

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
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between border-b shrink-0 px-3 bg-muted/30">
                  <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground">
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

                <div className="flex-1 overflow-y-auto p-3">
                  {!analysis && !isAnalyzing && !analysisError && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <Sparkles className="h-5 w-5 opacity-40" />
                      <p className="text-xs">
                        {submittedIds.has(currentItem.id) &&
                        !dirtyIds.has(currentItem.id)
                          ? 'Click Analyze to get AI feedback'
                          : 'Submit your answer first, then analyze'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-sky-400/20 hover:bg-sky-400/30"
                        onClick={handleAnalyze}
                        disabled={
                          isAnalyzing ||
                          isPending ||
                          !submittedIds.has(currentItem.id) ||
                          dirtyIds.has(currentItem.id)
                        }
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                        )}
                        Analyze
                      </Button>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing your answer...
                    </div>
                  )}
                  {analysisError && (
                    <p className="text-sm text-destructive py-2">
                      {analysisError}
                    </p>
                  )}
                  {analysis && (
                    <div className="space-y-3">
                      <ReviewAnalysis
                        analysis={analysis}
                        hideTitle
                        scoreSize="sm"
                      />

                      {/* MCQ: Reveal correct answer + explanation after analysis */}
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

                      {/* Key Points revealed after analysis */}
                      {rubric?.keyPoints && rubric.keyPoints.length > 0 && (
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
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Collapsed results expand bar — shown when results panel is collapsed */}
      {resultsCollapsed && (
        <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/30 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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

      {/* ── Bottom bar: Analyze + Rating buttons ── */}
      <div className="flex items-center justify-end gap-3 p-3 border-t h-full bg-card shrink-0">
        <TooltipProvider delayDuration={200}>
          {RATING_CONFIG.map(({ rating, label, tooltip, shortcut, color }) => (
            <Tooltip key={rating}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleRate(rating)}
                  disabled={isPending}
                  className={cn(
                    'h-7 text-xs px-3 bg-sr-recalled-bg text-sr-recalled',
                    color.bg
                  )}
                >
                  <span className="text-[10px] opacity-50 mr-1">
                    {shortcut}
                  </span>
                  <span className={color.text}>{label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      {/* Pass consent dialog */}
      <Dialog
        open={!!analysisConsent}
        onOpenChange={(open) => {
          if (!open) setAnalysisConsent(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extra Pass required</DialogTitle>
            <DialogDescription>
              Your answer is larger than the standard budget. This analysis will
              cost <strong>{analysisConsent?.estimatedPassCost} Pass</strong>{' '}
              instead of the base {analysisConsent?.basePassCost} Pass.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalysisConsent(null)}>
              Cancel
            </Button>
            <Button onClick={handleAnalysisConsentApprove}>
              Approve &amp; Analyze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
