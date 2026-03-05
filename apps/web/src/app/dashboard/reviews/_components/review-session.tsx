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
import { submitReview } from '@/lib/actions/review';
import { analyzeAnswer, type AnalysisResult } from '@/lib/actions/analysis';
import type { RecallItemDue, AnswerRubric } from '@/lib/fetchers/recall-items';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain,
  CheckCircle2,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Sparkles,
  Loader2,
} from 'lucide-react';
import AnswerEditor from '@/components/editor/answer-editor';
import type { Value } from 'platejs';

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
    color: 'text-red-500',
  },
  {
    rating: 2,
    label: 'Hard',
    tooltip: 'You recalled with significant difficulty — shorter interval',
    shortcut: '2',
    color: 'text-orange-500',
  },
  {
    rating: 3,
    label: 'Good',
    tooltip: 'You recalled correctly after some thought — normal interval',
    shortcut: '3',
    color: 'text-green-500',
  },
  {
    rating: 4,
    label: 'Easy',
    tooltip: 'You recalled instantly and effortlessly — longer interval',
    shortcut: '4',
    color: 'text-blue-500',
  },
];

interface ReviewSessionProps {
  initialItems: RecallItemDue[];
  topics: Array<{ id: string; name: string }>;
  currentTopicId?: string;
  currentNoteId?: string;
  dueCount: number;
}

export default function ReviewSession({
  initialItems,
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
  const answersRef = useRef<Map<string, Value>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Hydrate answersRef from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Value>;
        for (const [id, value] of Object.entries(parsed)) {
          answersRef.current.set(id, value);
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }
  }, []);

  const persistToLocalStorage = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const obj: Record<string, Value> = {};
        answersRef.current.forEach((v, k) => {
          obj[k] = v;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, 500);
  }, []);

  const removeFromLocalStorage = useCallback((itemId: string) => {
    answersRef.current.delete(itemId);
    try {
      const obj: Record<string, Value> = {};
      answersRef.current.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
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

    const plainText = answer
      .map((node) =>
        (node.children || []).map((child) => child.text || '').join('')
      )
      .join('\n')
      .trim();

    if (!plainText) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const result = await analyzeAnswer(
        plainText,
        currentItem.questionTitle ?? '',
        currentItem.questionText ?? '',
        criteria,
        keyPoints
      );
      setAnalysis(result);
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
        setCompletedCount((c) => c + 1);
        setReviewedIds((prev) => new Set(prev).add(currentItem.id));
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
        <CheckCircle2 className="h-16 w-16 text-green-500" />
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
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-card shrink-0">
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium flex items-center gap-1">
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

      {/* ── Main grid: two-column layout ── */}
      <div className="grid grid-cols-[1fr_1px_1fr] min-h-0">
        {/* ──── LEFT PANEL: Question + Rubric (no tabs, single scroll) ──── */}
        <div className="overflow-y-auto p-5">
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

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                {rubric?.type === 'mcq'
                  ? 'Choose one answer'
                  : rubric?.type === 'leetcode'
                  ? 'Problem Details'
                  : 'Answer Rubric'}
              </h3>

              {!rubric ? (
                <p className="text-sm text-muted-foreground italic">
                  No rubric available. Self-assess your recall.
                </p>
              ) : rubric.type === 'mcq' ? (
                /* ── MCQ: Show choices ── */
                <div className="space-y-2">
                  {rubric.choices.map((choice) => (
                    <div
                      key={choice.label}
                      className="flex items-start gap-2.5 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {choice.label}
                      </span>
                      <span className="text-sm leading-relaxed">
                        {choice.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : rubric.type === 'leetcode' ? (
                /* ── Leetcode: Function prototype + examples + constraints ── */
                <div className="space-y-4">
                  {rubric.functionPrototype && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Function Signature
                      </h4>
                      <pre className="text-sm bg-muted/50 rounded-md p-3 overflow-auto font-mono">
                        {rubric.functionPrototype}
                      </pre>
                    </div>
                  )}
                  {rubric.examples && rubric.examples.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Examples
                      </h4>
                      <div className="space-y-3">
                        {rubric.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-lg border p-3 bg-muted/20 space-y-1.5"
                          >
                            <p className="text-xs">
                              <span className="font-semibold text-muted-foreground">
                                Input:{' '}
                              </span>
                              <code className="text-xs bg-muted rounded px-1 py-0.5">
                                {ex.input}
                              </code>
                            </p>
                            <p className="text-xs">
                              <span className="font-semibold text-muted-foreground">
                                Output:{' '}
                              </span>
                              <code className="text-xs bg-muted rounded px-1 py-0.5">
                                {ex.output}
                              </code>
                            </p>
                            {ex.explanation && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">
                                  Explanation:{' '}
                                </span>
                                {ex.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {rubric.constraints && rubric.constraints.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Constraints
                      </h4>
                      <ul className="space-y-1">
                        {rubric.constraints.map((c, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-2"
                          >
                            <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            <code className="text-xs">{c}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : rubric.type === 'open_ended' ? (
                /* ── Open-ended: Sections + criteria ── */
                <div className="space-y-4">
                  {'sections' in rubric &&
                    rubric.sections &&
                    rubric.sections.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Required Sections
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {rubric.sections.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {'criteria' in rubric &&
                    rubric.criteria &&
                    rubric.criteria.length > 0 && (
                      <ol className="space-y-2">
                        {rubric.criteria.map((c, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2.5"
                          >
                            <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{c}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                </div>
              ) : (
                /* ── Legacy rubric (no type field) ── */
                <div>
                  {'criteria' in rubric &&
                  rubric.criteria &&
                  rubric.criteria.length > 0 ? (
                    <ol className="space-y-2">
                      {rubric.criteria.map((c, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2.5"
                        >
                          <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No rubric available. Self-assess your recall.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──── Vertical divider ──── */}
        <div className="bg-border" />

        {/* ──── RIGHT PANEL: Editor (top) + Results (bottom) ──── */}
        <div className="flex flex-col min-h-0">
          {/* Editor section */}
          <div className="flex flex-col flex-1 min-h-0 border-b">
            <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0 bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">
                Your Answer
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnswerEditor
                key={currentItem.id}
                initialValue={answersRef.current.get(currentItem.id)}
                onChange={(value) => {
                  answersRef.current.set(currentItem.id, value);
                  persistToLocalStorage();
                }}
                placeholder="Write your answer here..."
              />
            </div>
          </div>

          {/* Results section (like LeetCode's Testcase/Test Result) */}
          <div className="flex flex-col shrink-0 h-[35%] min-h-[140px]">
            <div className="flex items-center gap-0 border-b shrink-0 px-3 bg-muted/30">
              <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Results
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!analysis && !isAnalyzing && !analysisError && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Sparkles className="h-5 w-5 opacity-40" />
                  <p className="text-xs">Click Analyze to get AI feedback</p>
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your answer...
                </div>
              )}
              {analysisError && (
                <p className="text-sm text-destructive py-2">{analysisError}</p>
              )}
              {analysis && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${
                        analysis.suggestedRating === 1
                          ? 'text-red-500'
                          : analysis.suggestedRating === 2
                          ? 'text-orange-500'
                          : analysis.suggestedRating === 3
                          ? 'text-green-500'
                          : 'text-blue-500'
                      }`}
                    >
                      {analysis.scorePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Suggested:{' '}
                      <span className="font-medium text-foreground">
                        {analysis.suggestedLabel}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {analysis.reasoning}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wider">
                          Strengths
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {analysis.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500 shrink-0">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wider">
                          Weaknesses
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {analysis.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-red-500 shrink-0">-</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

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
        </div>
      </div>

      {/* ── Bottom bar: Analyze + Rating buttons ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-card shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isPending}
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1" />
          )}
          Analyze
        </Button>

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1.5">
            {RATING_CONFIG.map(
              ({ rating, label, tooltip, shortcut, color }) => (
                <Tooltip key={rating}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => handleRate(rating)}
                      disabled={isPending}
                      size="sm"
                      className="h-7 text-xs px-3"
                    >
                      <span className="text-[10px] opacity-50 mr-1">
                        {shortcut}
                      </span>
                      <span className={color}>{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
