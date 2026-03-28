'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';
import { BellRing, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatRelativeDue(due: string): string {
  const diff = new Date(due).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (diff <= 0) {
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m overdue`;
    if (hours < 24) return `${hours}h overdue`;
    return `${days}d overdue`;
  }
  if (mins < 60) return `in ${mins}m`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days}d`;
}

export function DueNowCardStack({
  dueItems,
  className,
}: {
  dueItems: RecallItemDue[];
  className?: string;
}) {
  const now = Date.now();
  const dueNow = dueItems.filter((i) => new Date(i.due).getTime() <= now);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const safeIndex = Math.min(currentIndex, Math.max(0, dueNow.length - 1));

  const goNext = useCallback(() => {
    if (isAnimating || safeIndex >= dueNow.length - 1) return;
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setIsAnimating(false);
      setDirection(null);
    }, 300);
  }, [isAnimating, safeIndex, dueNow.length]);

  const goPrev = useCallback(() => {
    if (isAnimating || safeIndex <= 0) return;
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((i) => i - 1);
      setIsAnimating(false);
      setDirection(null);
    }, 300);
  }, [isAnimating, safeIndex]);

  // Empty state
  if (dueNow.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 p-5 rounded-2xl bg-primary/5',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-secondary-foreground" />
          </div>
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
            Due Now
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <span className="text-3xl font-bold text-sr-recalled">0</span>
          <span className="text-xs text-muted-foreground">all caught up!</span>
        </div>
      </div>
    );
  }

  const currentItem = dueNow[safeIndex];
  // Build visible stack: current + up to 2 behind
  const stackItems = dueNow.slice(safeIndex, safeIndex + 3);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-2xl bg-primary/5 shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 shrink-0">
          <BellRing className="h-3.5 w-3.5 text-destructive" />
        </div>
        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
          Due Now
        </span>
      </div>

      <span className="text-2xl font-bold tabular-nums text-sr-lapsed">
        {dueNow.length}
      </span>

      {/* Card stack container */}
      <div className="relative h-[72px]">
        {/* Background stack cards */}
        {stackItems.map((item, offset) => {
          if (offset === 0) return null;
          return (
            <div
              key={item.id}
              className="absolute inset-x-0 top-0 h-full rounded-lg bg-accent-orange-bg/50 border border-accent-orange/10 pointer-events-none"
              style={{
                transform: `translateY(${offset * 4}px) scale(${1 - offset * 0.04})`,
                opacity: 1 - offset * 0.3,
                zIndex: 10 - offset,
              }}
            />
          );
        })}

        {/* Front card */}
        <Link
          href="/dashboard/reviews"
          className={cn(
            'absolute inset-x-0 top-0 h-full rounded-lg bg-accent-orange-bg border border-accent-orange/15 px-3 py-2.5 flex flex-col justify-between cursor-pointer transition-all duration-300 ease-out hover:border-accent-orange/30',
            isAnimating && direction === 'next' && '-translate-x-full opacity-0 scale-95',
            isAnimating && direction === 'prev' && 'translate-x-full opacity-0 scale-95',
          )}
          style={{ zIndex: 20 }}
        >
          <p className="text-xs font-semibold truncate text-foreground">
            {currentItem.questionTitle || currentItem.chunkName}
          </p>
          <p className="text-[0.55rem] text-muted-foreground truncate">
            {currentItem.topicName} &gt; {currentItem.noteName}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[0.55rem] font-medium text-accent-orange">
              {formatRelativeDue(currentItem.due)}
            </span>
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sr-lapsed opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-sr-lapsed" />
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={safeIndex <= 0 || isAnimating}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-background/60 hover:bg-background transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        <span className="text-[0.55rem] font-bold text-muted-foreground tabular-nums">
          {safeIndex + 1} of {dueNow.length}
        </span>

        <button
          onClick={goNext}
          disabled={safeIndex >= dueNow.length - 1 || isAnimating}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-background/60 hover:bg-background transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next card"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
