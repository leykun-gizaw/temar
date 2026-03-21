'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { RecallItemDue, ReviewLogEntry } from '@/lib/fetchers/recall-items';

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

const RATING_COLORS: Record<number, string> = {
  1: 'text-fsrs-again',
  2: 'text-fsrs-hard',
  3: 'text-fsrs-good',
  4: 'text-fsrs-easy',
};

interface UpcomingSessionsProps {
  allItems: RecallItemDue[];
  dueItems: RecallItemDue[];
  dueCount?: number;
}

export function UpcomingSessions({
  allItems,
  dueItems,
  dueCount = 0,
}: UpcomingSessionsProps) {
  const now = useMemo(() => new Date(), []);
  const todayStr = now.toDateString();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [pastLogs, setPastLogs] = useState<ReviewLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const weekDays = useMemo(() => getWeekDays(now, weekOffset), [now, weekOffset]);
  const selectedDateStr = selectedDate.toDateString();
  const isSelectedToday = selectedDateStr === todayStr;
  const isCurrentWeek = weekOffset === 0;

  // Build lookup from recallItemId → item info for enriching past logs
  const itemMap = useMemo(() => {
    const map = new Map<string, RecallItemDue>();
    for (const item of allItems) map.set(item.id, item);
    return map;
  }, [allItems]);

  // Fetch past review logs when week changes
  const fetchLogsForWeek = useCallback(async (start: Date, end: Date) => {
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        from: startOfDay(start).toISOString(),
        to: endOfDay(end).toISOString(),
      });
      const res = await fetch(`/api/review-logs?${params}`);
      if (res.ok) {
        const logs: ReviewLogEntry[] = await res.json();
        setPastLogs(logs);
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    fetchLogsForWeek(start, end);
  }, [weekDays, fetchLogsForWeek]);

  // When changing week, auto-select today (if current week) or Monday
  useEffect(() => {
    if (isCurrentWeek) {
      setSelectedDate(now);
    } else {
      setSelectedDate(weekDays[0].date);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  // --- Build timeline items for selected day ---

  // Future/due items: filter allItems + dueItems by selected date
  const scheduledItems = useMemo(() => {
    if (isSelectedToday) {
      // For today: show overdue (from dueItems) + items due today (from allItems)
      const dueSet = new Set(dueItems.map((i) => i.id));
      const todayFromAll = allItems.filter(
        (item) =>
          new Date(item.due).toDateString() === todayStr && !dueSet.has(item.id)
      );
      return [...dueItems, ...todayFromAll];
    }
    // For future days: items from allItems where due matches selected day
    return allItems.filter(
      (item) => new Date(item.due).toDateString() === selectedDateStr
    );
  }, [allItems, dueItems, selectedDateStr, todayStr, isSelectedToday]);

  // Past review logs for selected day
  const dayLogs = useMemo(() => {
    return pastLogs.filter(
      (log) => new Date(log.reviewedAt).toDateString() === selectedDateStr
    );
  }, [pastLogs, selectedDateStr]);

  // Split scheduled items into "due now" vs "later"
  const dueNowItems = isSelectedToday
    ? scheduledItems.filter((item) => new Date(item.due).getTime() <= now.getTime())
    : [];
  const laterItems = isSelectedToday
    ? scheduledItems.filter((item) => new Date(item.due).getTime() > now.getTime())
    : scheduledItems;

  // Is the selected date in the past (before today)?
  const isSelectedPast =
    startOfDay(selectedDate).getTime() < startOfDay(now).getTime();

  const hasContent =
    dueNowItems.length > 0 || laterItems.length > 0 || dayLogs.length > 0;

  // Format the selected date for display
  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="p-6 rounded-[2rem] bg-muted/50 flex flex-col gap-4 flex-1 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm">Reviews Schedule</h3>
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
            {dueCount > 0
              ? `${dueCount} review${dueCount !== 1 ? 's' : ''} due`
              : 'No reviews due'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl bg-background/60"
          asChild
        >
          <Link href="/dashboard/reviews">
            <CalendarDays className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={() => {
            setWeekOffset(0);
            setSelectedDate(now);
          }}
          className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          {isCurrentWeek
            ? 'This week'
            : weekDays[0].date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              }) +
              ' – ' +
              weekDays[6].date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Week strip */}
      <div className="flex justify-between items-center bg-background/80 p-2.5 rounded-2xl gap-1">
        {weekDays.map((day) => {
          const isToday = day.date.toDateString() === todayStr;
          const isSelected = day.date.toDateString() === selectedDateStr;
          // Check if this day has items
          const dayHasItems =
            allItems.some(
              (i) => new Date(i.due).toDateString() === day.date.toDateString()
            ) ||
            pastLogs.some(
              (l) =>
                new Date(l.reviewedAt).toDateString() === day.date.toDateString()
            );
          return (
            <button
              key={day.label + day.num}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={
                isSelected
                  ? 'flex flex-col items-center bg-primary text-primary-foreground w-9 h-11 justify-center rounded-xl shadow-md transition-all relative'
                  : isToday
                  ? 'flex flex-col items-center w-9 h-11 justify-center rounded-xl ring-1 ring-primary/30 transition-all hover:bg-muted/80 relative'
                  : 'flex flex-col items-center w-9 h-11 justify-center rounded-xl transition-all hover:bg-muted/80 relative'
              }
            >
              <span className="text-[0.55rem] font-bold uppercase">
                {day.label}
              </span>
              <span className="text-sm font-bold">{day.num}</span>
              {dayHasItems && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date display */}
      <p className="text-xs font-semibold text-center text-muted-foreground">
        {formattedDate}
      </p>

      {/* Timeline */}
      <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto">
        {isLoadingLogs && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Loading...
          </p>
        )}

        {/* Past review logs for this day */}
        {dayLogs.map((log) => {
          const item = itemMap.get(log.recallItemId);
          return (
            <TimelineSlot
              key={log.id}
              time={formatTime(log.reviewedAt)}
              status="past"
              title={item?.questionTitle || item?.chunkName || 'Reviewed item'}
              subtitle={
                item
                  ? `${item.topicName} > ${item.noteName}`
                  : undefined
              }
              badge={RATING_LABELS[log.rating]}
              badgeColor={RATING_COLORS[log.rating]}
            />
          );
        })}

        {/* Due now */}
        {dueNowItems.map((item) => (
          <TimelineSlot
            key={item.id}
            time={formatDueTime(item.due)}
            status="upcoming"
            title={item.questionTitle || item.chunkName}
            subtitle={`${item.topicName} > ${item.noteName}`}
          />
        ))}

        {/* Scheduled / future */}
        {laterItems.map((item) => (
          <TimelineSlot
            key={item.id}
            time={formatDueTime(item.due)}
            status={isSelectedPast ? 'past' : 'scheduled'}
            title={item.questionTitle || item.chunkName}
            subtitle={`${item.topicName} > ${item.noteName}`}
          />
        ))}

        {!isLoadingLogs && !hasContent && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No reviews for this day.
          </p>
        )}
      </div>
    </Card>
  );
}

function TimelineSlot({
  time,
  status,
  title,
  subtitle,
  badge,
  badgeColor,
}: {
  time: string;
  status: 'upcoming' | 'scheduled' | 'past';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}) {
  const styles = {
    upcoming: {
      dot: 'bg-amber-500',
      border: 'border-amber-300/40',
      label: 'Due Now',
      labelColor: 'text-amber-600 dark:text-amber-400',
      timeColor: 'text-amber-600/70 dark:text-amber-400/70',
      bg: 'bg-amber-500/8',
    },
    past: {
      dot: 'bg-emerald-500',
      border: 'border-emerald-300/30',
      label: 'Reviewed',
      labelColor: 'text-emerald-600 dark:text-emerald-400',
      timeColor: 'text-emerald-600/60 dark:text-emerald-400/60',
      bg: 'bg-emerald-500/8',
    },
    scheduled: {
      dot: 'bg-blue-400/60',
      border: 'border-blue-200/30',
      label: 'Scheduled',
      labelColor: 'text-blue-500/70 dark:text-blue-400/60',
      timeColor: 'text-muted-foreground/60',
      bg: 'bg-blue-500/5',
    },
  }[status];

  return (
    <div className={`relative pl-5 border-l ${styles.border}`}>
      <div
        className={`absolute -left-1 top-0 w-2 h-2 rounded-full ${styles.dot}`}
      />
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[0.65rem] font-bold ${styles.timeColor}`}>
          {time}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className={`text-[0.6rem] font-bold ${badgeColor ?? ''}`}>
              {badge}
            </span>
          )}
          <span className={`text-[0.65rem] font-bold uppercase ${styles.labelColor}`}>
            {styles.label}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-xl text-xs ${styles.bg}`}>
        <p className="font-semibold truncate">{title}</p>
        {subtitle && (
          <p className="text-[0.65rem] text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Helpers ---

function getWeekDays(now: Date, weekOffset: number) {
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, num: d.getDate(), date: d };
  });
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDueTime(due: string | Date): string {
  const d = new Date(due);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
