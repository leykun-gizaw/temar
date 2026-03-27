'use client';

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityHeatmapFullProps {
  data: Array<{ date: string; count: number }>;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function intensityClass(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900';
  if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';
  return 'bg-emerald-500 dark:bg-emerald-500';
}

export function ActivityHeatmapFull({ data }: ActivityHeatmapFullProps) {
  const { weeks, monthLabels, totalReviews, isEmpty } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], monthLabels: [], totalReviews: 0, isEmpty: true };
    }

    const total = data.reduce((sum, d) => sum + d.count, 0);

    // Build lookup map for quick access
    const countMap = new Map<string, number>();
    for (const d of data) {
      countMap.set(d.date, d.count);
    }

    // Start from 364 days ago to get ~52 weeks
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 363);

    // Align start to Monday
    const startDay = start.getDay(); // 0=Sun
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    start.setDate(start.getDate() + mondayOffset);

    const allCells: { date: string; count: number; month: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const dateStr = cursor.toISOString().slice(0, 10);
      allCells.push({
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
        month: cursor.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Split into weeks (columns of 7)
    const weekColumns: (typeof allCells)[] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weekColumns.push(allCells.slice(i, i + 7));
    }

    // Pad the last week to 7 if needed
    const lastWeek = weekColumns[weekColumns.length - 1];
    if (lastWeek && lastWeek.length < 7) {
      while (lastWeek.length < 7) {
        lastWeek.push({ date: '', count: -1, month: -1 });
      }
    }

    // Compute month labels: find first week where each month starts
    const months: { label: string; colIndex: number }[] = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    let lastMonth = -1;
    for (let wi = 0; wi < weekColumns.length; wi++) {
      const firstCell = weekColumns[wi][0];
      if (firstCell && firstCell.month !== lastMonth && firstCell.month !== -1) {
        months.push({ label: monthNames[firstCell.month], colIndex: wi });
        lastMonth = firstCell.month;
      }
    }

    return {
      weeks: weekColumns,
      monthLabels: months,
      totalReviews: total,
      isEmpty: total === 0 && data.length === 0,
    };
  }, [data]);

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 shrink-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Activity</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalReviews.toLocaleString()} reviews
        </span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No review activity yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex flex-col gap-1 min-w-fit">
            {/* Month labels */}
            <div className="flex" style={{ paddingLeft: 28 }}>
              {weeks.map((_, wi) => {
                const monthEntry = monthLabels.find((m) => m.colIndex === wi);
                return (
                  <div
                    key={wi}
                    className="text-[9px] text-muted-foreground"
                    style={{ width: 14 }}
                  >
                    {monthEntry?.label ?? ''}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] pr-1">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="h-[12px] w-[20px] flex items-center justify-end text-[9px] text-muted-foreground pr-0.5"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      className={cn(
                        'h-[12px] w-[12px] rounded-[2px] transition-colors',
                        cell.count < 0
                          ? 'bg-transparent'
                          : intensityClass(cell.count)
                      )}
                      title={
                        cell.count >= 0
                          ? `${cell.date}: ${cell.count} review${cell.count !== 1 ? 's' : ''}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <span className="text-[9px] text-muted-foreground">Less</span>
              <div className="h-[10px] w-[10px] rounded-[2px] bg-muted" />
              <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
              <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
              <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
              <span className="text-[9px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
