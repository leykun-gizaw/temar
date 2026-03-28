'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Badge,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@temar/ui';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  BarChart3,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
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

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const STATE_BADGE_STYLES: Record<number, string> = {
  0: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  1: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  2: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  3: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  open_ended: 'Open-ended',
  mcq: 'MCQ',
  leetcode: 'LeetCode',
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
  const todayStart = useMemo(() => startOfDay(now), [now]);

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
    startOfDay(selectedDate).getTime() < todayStart.getTime();

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
          const dayDateStr = day.date.toDateString();
          // Check if this day has items
          const dayHasItems =
            allItems.some(
              (i) => new Date(i.due).toDateString() === dayDateStr
            ) ||
            pastLogs.some(
              (l) =>
                new Date(l.reviewedAt).toDateString() === dayDateStr
            );
          // Check if this day has overdue items (due before start of today)
          const dayHasOverdue = allItems.some(
            (i) => {
              const dueDate = new Date(i.due);
              return (
                dueDate.toDateString() === dayDateStr &&
                dueDate.getTime() < todayStart.getTime()
              );
            }
          );
          // For today, also check if dueItems has items from past days
          const todayHasOverdue =
            isToday &&
            dueItems.some(
              (i) => new Date(i.due).getTime() < todayStart.getTime()
            );
          const hasOverdue = dayHasOverdue || todayHasOverdue;

          return (
            <button
              key={day.label + day.num}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={
                isSelected
                  ? `flex flex-col items-center ${hasOverdue ? 'bg-red-500 dark:bg-red-600' : 'bg-primary'} text-primary-foreground w-9 h-11 justify-center rounded-xl shadow-md transition-all relative`
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
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    hasOverdue
                      ? 'bg-red-400/80'
                      : 'bg-primary/60'
                  }`}
                />
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
              item={item}
              log={log}
            />
          );
        })}

        {/* Due now */}
        {dueNowItems.map((item) => {
          const isOverdue = new Date(item.due).getTime() < todayStart.getTime();
          return (
            <TimelineSlot
              key={item.id}
              time={formatDueTime(item.due)}
              status={isOverdue ? 'overdue' : 'upcoming'}
              title={item.questionTitle || item.chunkName}
              subtitle={`${item.topicName} > ${item.noteName}`}
              item={item}
            />
          );
        })}

        {/* Scheduled / future */}
        {laterItems.map((item) => (
          <TimelineSlot
            key={item.id}
            time={formatDueTime(item.due)}
            status={isSelectedPast ? 'past' : 'scheduled'}
            title={item.questionTitle || item.chunkName}
            subtitle={`${item.topicName} > ${item.noteName}`}
            item={item}
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
  item,
  log,
}: {
  time: string;
  status: 'upcoming' | 'scheduled' | 'past' | 'overdue';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  item?: RecallItemDue;
  log?: ReviewLogEntry;
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
    overdue: {
      dot: 'bg-red-500',
      border: 'border-red-300/40',
      label: 'Overdue',
      labelColor: 'text-red-600 dark:text-red-400',
      timeColor: 'text-red-600/70 dark:text-red-400/70',
      bg: 'bg-red-500/8',
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

  const overdueDays =
    status === 'overdue' && item
      ? Math.floor(
          (Date.now() - new Date(item.due).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  const slotContent = (
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
          {status === 'overdue' && overdueDays > 0 && (
            <span className="text-[0.6rem] font-bold text-red-500 dark:text-red-400 flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {overdueDays}d
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

  // Only show hover card if we have an item or log to show details for
  if (!item && !log) return slotContent;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{slotContent}</div>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="start"
        className="w-72 p-0 rounded-xl overflow-hidden"
      >
        <HoverCardBody item={item} log={log} />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardBody({
  item,
  log,
}: {
  item?: RecallItemDue;
  log?: ReviewLogEntry;
}) {
  const now = Date.now();

  return (
    <div className="flex flex-col">
      {/* Header with question title */}
      <div className="p-3 pb-2 border-b border-border/50">
        <p className="text-xs font-semibold leading-snug line-clamp-2">
          {item?.questionTitle || item?.chunkName || 'Review item'}
        </p>
        {item?.questionText && (
          <p className="text-[0.65rem] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {item.questionText.slice(0, 100)}
            {item.questionText.length > 100 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Badges row */}
      <div className="px-3 pt-2 pb-1.5 flex flex-wrap gap-1.5">
        {item && (
          <Badge
            variant="outline"
            className={`text-[0.6rem] px-1.5 py-0 h-5 font-semibold ${STATE_BADGE_STYLES[item.state] ?? ''}`}
          >
            {STATE_LABELS[item.state] ?? 'Unknown'}
          </Badge>
        )}
        {item?.questionType && (
          <Badge
            variant="outline"
            className="text-[0.6rem] px-1.5 py-0 h-5 font-semibold"
          >
            {QUESTION_TYPE_LABELS[item.questionType] ?? item.questionType}
          </Badge>
        )}
        {log && (
          <Badge
            variant="outline"
            className={`text-[0.6rem] px-1.5 py-0 h-5 font-semibold ${RATING_COLORS[log.rating] ?? ''}`}
          >
            {RATING_LABELS[log.rating] ?? `Rating ${log.rating}`}
          </Badge>
        )}
      </div>

      {/* Stats grid */}
      <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {item && (
          <>
            <StatRow icon={BarChart3} label="Stability" value={`${item.stability.toFixed(1)}d`} />
            <StatRow icon={BarChart3} label="Difficulty" value={item.difficulty.toFixed(2)} />
            <StatRow icon={RotateCcw} label="Reps" value={String(item.reps)} />
            <StatRow icon={AlertTriangle} label="Lapses" value={String(item.lapses)} />
          </>
        )}
        {item?.lastReview && (
          <div className="col-span-2">
            <StatRow
              icon={Clock}
              label="Last review"
              value={formatRelativeDate(item.lastReview, now)}
            />
          </div>
        )}
        {log?.durationMs != null && log.durationMs > 0 && (
          <div className="col-span-2">
            <StatRow
              icon={Clock}
              label="Duration"
              value={formatDuration(log.durationMs)}
            />
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      {item && (
        <div className="px-3 pb-2">
          <p className="text-[0.6rem] text-muted-foreground truncate">
            {item.topicName} &gt; {item.noteName} &gt; {item.chunkName}
          </p>
        </div>
      )}

      {/* Analysis summary for past reviews */}
      {log?.analysisJson != null && (
        <div className="px-3 pb-2">
          <p className="text-[0.6rem] text-muted-foreground line-clamp-2 leading-relaxed">
            {extractAnalysisSummary(log.analysisJson)}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none text-[0.65rem] h-8 font-semibold"
          asChild
        >
          <Link href="/dashboard/reviews">Start Review</Link>
        </Button>
        <div className="w-px bg-border/50" />
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none text-[0.65rem] h-8 font-semibold"
          asChild
        >
          <Link href="/dashboard/reviews?tab=history">View History</Link>
        </Button>
      </div>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      <span className="text-[0.6rem] text-muted-foreground">{label}</span>
      <span className="text-[0.6rem] font-semibold ml-auto">{value}</span>
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

function formatRelativeDate(dateStr: string, nowMs: number): string {
  const diffMs = nowMs - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function extractAnalysisSummary(analysisJson: unknown): string {
  if (!analysisJson || typeof analysisJson !== 'object') return '';
  const analysis = analysisJson as Record<string, unknown>;
  if (typeof analysis.summary === 'string') return analysis.summary;
  if (typeof analysis.feedback === 'string') return analysis.feedback;
  if (typeof analysis.explanation === 'string') return analysis.explanation;
  return '';
}
