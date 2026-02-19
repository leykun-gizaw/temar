'use client';

import { useState, useRef, useTransition, useCallback } from 'react';
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
import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RotateCcw,
  Brain,
  CheckCircle2,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Lightbulb,
  ArrowRight,
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
    subtitle: "Didn't recall",
    tooltip:
      "You couldn't recall the answer — this card will be shown again soon",
    variant: 'destructive' as const,
    shortcut: '1',
  },
  {
    rating: 2,
    label: 'Hard',
    subtitle: 'Barely recalled',
    tooltip: 'You recalled with significant difficulty — shorter interval',
    variant: 'outline' as const,
    shortcut: '2',
  },
  {
    rating: 3,
    label: 'Good',
    subtitle: 'Recalled with effort',
    tooltip: 'You recalled correctly after some thought — normal interval',
    variant: 'default' as const,
    shortcut: '3',
  },
  {
    rating: 4,
    label: 'Easy',
    subtitle: 'Instant recall',
    tooltip: 'You recalled instantly and effortlessly — longer interval',
    variant: 'secondary' as const,
    shortcut: '4',
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
  const answersRef = useRef<Map<string, Value>>(new Map());

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
    // Find the next unreviewed item
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (!reviewedIds.has(items[i].id)) {
        setCurrentIndex(i);
        setReviewStartTime(Date.now());
        return;
      }
    }
    // Wrap around from the start
    for (let i = 0; i < currentIndex; i++) {
      if (!reviewedIds.has(items[i].id)) {
        setCurrentIndex(i);
        setReviewStartTime(Date.now());
        return;
      }
    }
    // All reviewed — session complete
    setItems([]);
    setCurrentIndex(0);
  }, [currentIndex, items, reviewedIds]);

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
          answer ?? undefined
        );
        setCompletedCount((c) => c + 1);
        setReviewedIds((prev) => new Set(prev).add(currentItem.id));
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
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Session Complete</h2>
          <p className="text-muted-foreground">
            {completedCount > 0
              ? `You reviewed ${completedCount} item${
                  completedCount !== 1 ? 's' : ''
                }.`
              : 'No items due for review right now.'}
          </p>
        </div>
        <Button onClick={() => router.refresh()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Check for more
        </Button>
      </div>
    );
  }

  const rubric = currentItem.answerRubric as {
    criteria: string[];
    keyPoints: string[];
  } | null;
  const isCurrentReviewed = reviewedIds.has(currentItem.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-end justify-between px-6 py-2 border shrink-0">
        <div className="flex flex-col">
          <div className="flex items-end gap-2 space-y-1 ">
            <span className="text-5xl">📝</span>
            <h1 className="text-2xl font-semibold">Reviews</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {dueCount} item{dueCount !== 1 ? 's' : ''} due for review
          </p>
        </div>
        <div className="flex flex-col items-start gap-4">
          <span className="text-sm text-muted-foreground">
            {currentItem.topicName} &gt; {currentItem.noteName}
          </span>
          <Select
            defaultValue={currentTopicId ?? 'all'}
            onValueChange={handleScopeChange}
          >
            <SelectTrigger className="w-[350px]">
              <SelectValue placeholder="Filter by topic" />
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
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs px-2 py-1 rounded-full bg-muted">
            {STATE_LABELS[currentItem.state] ?? 'Unknown'}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>{completedCount} reviewed</span>
          </div>
        </div>
      </div>

      {/* Two-column main area */}
      <div className="flex flex-1 min-h-0 divide-x">
        {/* Left column: Question + Rubric */}
        <div className="w-1/2 flex flex-col overflow-y-auto p-6 gap-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
              Question
            </h3>
            {currentItem.questionText ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {/* <Markdown remarkPlugins={[remarkGfm]}> */}
                <b>{currentItem.questionText}</b>
                {/* </Markdown> */}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-muted-foreground text-sm italic">
                  No question generated yet for this item. Showing chunk content
                  as reference:
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
          </div>

          <hr />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              Answer Rubric
            </h3>
            {rubric ? (
              <div className="space-y-4">
                {rubric.criteria.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Criteria</h4>
                    <ul className="space-y-1.5">
                      {rubric.criteria.map((c, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                            {i + 1}
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rubric.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Key Points
                    </h4>
                    <ul className="space-y-1.5">
                      {rubric.keyPoints.map((kp, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="shrink-0 text-primary">•</span>
                          {kp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No rubric available. Self-assess your recall based on the
                question above.
              </p>
            )}
          </div>
        </div>

        {/* Right column: Plate.js Answer Editor */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Answer
            </h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AnswerEditor
              key={currentItem.id}
              onChange={(value) => {
                answersRef.current.set(currentItem.id, value);
              }}
              placeholder="Write your answer here... (supports rich text, code blocks, and mermaid diagrams)"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t shrink-0 bg-card">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm font-medium tabular-nums px-2">
            {currentIndex + 1} / {items.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= items.length - 1 || isPending}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isPending}
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>

        {/* Right: Rating buttons with descriptions */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2">
            {isCurrentReviewed && (
              <span className="text-xs text-muted-foreground mr-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Reviewed
              </span>
            )}
            {RATING_CONFIG.map(
              ({ rating, label, subtitle, tooltip, variant, shortcut }) => (
                <Tooltip key={rating}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={'outline'}
                      onClick={() => handleRate(rating)}
                      disabled={isPending}
                      size="sm"
                      className="flex items-center justify-between gap-0 h-auto py-1.5 px-3 min-w-[80px] w-40"
                    >
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">
                            {shortcut}
                          </span>
                          <span className="text-sm font-medium">{label}</span>
                        </span>
                        <span className="text-[10px] opacity-60 font-normal">
                          {subtitle}
                        </span>
                      </div>
                      <ArrowRight />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{tooltip}</p>
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
