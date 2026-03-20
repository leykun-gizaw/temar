'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';

/**
 * Week strip + timeline view for upcoming review items.
 * Days are clickable to filter by date. Shows all 7 days (Mon–Sun).
 */
export function UpcomingSessions({
  dueItems,
  dueCount = 0,
}: {
  dueItems: RecallItemDue[];
  dueCount?: number;
}) {
  const now = new Date();
  const weekDays = getWeekDays(now);
  const [selectedDate, setSelectedDate] = useState<Date>(now);

  const selectedDateStr = selectedDate.toDateString();
  const todayStr = now.toDateString();
  const isSelectedToday = selectedDateStr === todayStr;

  // Items for the selected day
  const dayItems = dueItems.filter((item) => {
    const dueDate = new Date(item.due);
    if (isSelectedToday) {
      // For today: show overdue + due today
      return dueDate.toDateString() === todayStr || dueDate.getTime() <= now.getTime();
    }
    return dueDate.toDateString() === selectedDateStr;
  });

  const dueNow = isSelectedToday
    ? dayItems.filter((item) => new Date(item.due).getTime() <= now.getTime())
    : [];
  const later = isSelectedToday
    ? dayItems.filter((item) => new Date(item.due).getTime() > now.getTime())
    : dayItems;

  const selectedDayLabel = isSelectedToday
    ? 'today'
    : selectedDate.toLocaleDateString([], { weekday: 'long' });

  return (
    <Card className="p-6 rounded-[2rem] bg-muted/50 flex flex-col gap-5 flex-1 min-h-0">
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

      {/* Week strip — all 7 days, clickable */}
      <div className="flex justify-between items-center bg-background/80 p-2.5 rounded-2xl gap-1">
        {weekDays.map((day) => {
          const isToday = day.date.toDateString() === todayStr;
          const isSelected = day.date.toDateString() === selectedDateStr;
          return (
            <button
              key={day.label}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={
                isSelected
                  ? 'flex flex-col items-center bg-primary text-primary-foreground w-9 h-11 justify-center rounded-xl shadow-md transition-all'
                  : isToday
                  ? 'flex flex-col items-center w-9 h-11 justify-center rounded-xl ring-1 ring-primary/30 transition-all hover:bg-muted/80'
                  : 'flex flex-col items-center w-9 h-11 justify-center rounded-xl transition-all hover:bg-muted/80'
              }
            >
              <span className="text-[0.55rem] font-bold uppercase">
                {day.label}
              </span>
              <span className="text-sm font-bold">{day.num}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3 pt-1 flex-1 min-h-0 overflow-y-auto">
        {dueNow.map((item) => (
          <TimelineSlot
            key={item.id}
            time={formatDueTime(item.due)}
            status="upcoming"
            title={item.questionTitle || item.chunkName}
            subtitle={`${item.topicName} > ${item.noteName}`}
          />
        ))}
        {later.map((item) => (
          <TimelineSlot
            key={item.id}
            time={formatDueTime(item.due)}
            status="scheduled"
            title={item.questionTitle || item.chunkName}
            subtitle={`${item.topicName} > ${item.noteName}`}
          />
        ))}
        {dayItems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No reviews scheduled for {selectedDayLabel}.
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
}: {
  time: string;
  status: 'upcoming' | 'scheduled';
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative pl-5 border-l border-border">
      {/* Dot */}
      <div
        className={`absolute -left-1 top-0 w-2 h-2 rounded-full ${
          status === 'upcoming' ? 'bg-primary' : 'bg-muted-foreground/40'
        }`}
      />
      <div className="flex justify-between items-center mb-1">
        <span className="text-[0.65rem] font-bold text-muted-foreground">
          {time}
        </span>
        <span
          className={`text-[0.65rem] font-bold uppercase ${
            status === 'upcoming'
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          {status === 'upcoming' ? 'Due Now' : 'Scheduled'}
        </span>
      </div>
      <div
        className={`p-3 rounded-xl text-xs ${
          status === 'upcoming'
            ? 'bg-primary/5'
            : 'bg-background/80'
        }`}
      >
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

function getWeekDays(now: Date) {
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diff);

  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, num: d.getDate(), date: d };
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
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
