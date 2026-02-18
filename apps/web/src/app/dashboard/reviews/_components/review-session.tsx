'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitReview } from '@/lib/actions/review';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronRight, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const RATING_CONFIG = [
  { rating: 1, label: 'Again', variant: 'destructive' as const, shortcut: '1' },
  { rating: 2, label: 'Hard', variant: 'outline' as const, shortcut: '2' },
  { rating: 3, label: 'Good', variant: 'default' as const, shortcut: '3' },
  { rating: 4, label: 'Easy', variant: 'secondary' as const, shortcut: '4' },
];

interface ReviewSessionProps {
  initialItems: RecallItemDue[];
  topics: Array<{ id: string; name: string }>;
  currentTopicId?: string;
  currentNoteId?: string;
}

export default function ReviewSession({
  initialItems,
  topics,
  currentTopicId,
  currentNoteId,
}: ReviewSessionProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now());
  const [isPending, startTransition] = useTransition();
  const [completedCount, setCompletedCount] = useState(0);

  const currentItem = items[currentIndex];
  const isSessionComplete = !currentItem;

  const handleScopeChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/reviews');
    } else {
      router.push(`/dashboard/reviews?topicId=${value}`);
    }
  };

  const handleReveal = () => {
    setShowContent(true);
  };

  const handleRate = (rating: number) => {
    if (!currentItem) return;

    const durationMs = Date.now() - reviewStartTime;

    startTransition(async () => {
      try {
        await submitReview(currentItem.id, rating, durationMs);
        setCompletedCount((c) => c + 1);
        setShowContent(false);
        setReviewStartTime(Date.now());

        if (currentIndex + 1 < items.length) {
          setCurrentIndex((i) => i + 1);
        } else {
          setItems([]);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error('Review submission failed:', err);
      }
    });
  };

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Session Complete</h2>
          <p className="text-muted-foreground">
            {completedCount > 0
              ? `You reviewed ${completedCount} item${completedCount !== 1 ? 's' : ''}.`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            defaultValue={currentTopicId ?? 'all'}
            onValueChange={handleScopeChange}
          >
            <SelectTrigger className="w-[220px]">
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
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>{completedCount} reviewed this session</span>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{currentItem.chunkName}</CardTitle>
              <CardDescription>
                {currentItem.topicName} &gt; {currentItem.noteName}
              </CardDescription>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted">
              {STATE_LABELS[currentItem.state] ?? 'Unknown'} &middot; {currentItem.reps} reps
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <p className="text-lg font-medium">
              What do you recall about this chunk?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try to recall the content before revealing it.
            </p>
          </div>

          {!showContent ? (
            <div className="flex justify-center">
              <Button size="lg" onClick={handleReveal}>
                Show Content
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                {currentItem.chunkName ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {`**${currentItem.chunkName}**\n\n_Content from the chunk will be displayed here once the FSRS service is connected._`}
                    </Markdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No content available for this chunk.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  How well did you recall this?
                </p>
                <div className="flex justify-center gap-3">
                  {RATING_CONFIG.map(({ rating, label, variant, shortcut }) => (
                    <Button
                      key={rating}
                      variant={variant}
                      size="lg"
                      onClick={() => handleRate(rating)}
                      disabled={isPending}
                      className="min-w-[100px]"
                    >
                      <span className="mr-1 text-xs opacity-60">{shortcut}</span>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
