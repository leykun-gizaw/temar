import { Card, cn } from '@temar/ui';
import type { ConsistencyStats } from '@/lib/fetchers/dashboard-stats';
import { Flame, CalendarDays, Zap } from 'lucide-react';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function intensityClass(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count <= 2) return 'bg-emerald-500/20';
  if (count <= 5) return 'bg-emerald-500/40';
  if (count <= 10) return 'bg-emerald-500/65';
  return 'bg-emerald-500';
}

function ActivityHeatmap({
  grid,
}: {
  grid: { date: string; count: number }[];
}) {
  // Organize into columns (weeks). Each column has 7 rows (Mon-Sun).
  const firstDate = new Date(grid[0]?.date ?? new Date());
  // getUTCDay(): 0=Sun, 1=Mon ... we want Mon=0 (dates are UTC strings)
  const firstDayOfWeek = (firstDate.getUTCDay() + 6) % 7;

  // Build padded cells: null for padding, then actual data
  const cells: ({ date: string; count: number } | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (const day of grid) {
    cells.push(day);
  }

  // Split into weeks (columns of up to 7)
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Pad the last week to 7 if needed
  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek && lastWeek.length < 7) {
    while (lastWeek.length < 7) {
      lastWeek.push(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-[3px]">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[12px] w-[12px] flex items-center justify-center text-[9px] text-muted-foreground"
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                className={cn(
                  'h-[12px] w-[12px] rounded-[2px] transition-colors',
                  cell ? intensityClass(cell.count) : 'bg-transparent'
                )}
                title={
                  cell
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
        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500/20" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500/40" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500/65" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500" />
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

export function ConsistencyCard({
  stats,
  className,
}: {
  stats: ConsistencyStats;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col gap-4 p-4 rounded-[2rem]', className)}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Consistency</span>
      </div>

      {/* Streak stats row */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-fsrs-hard-bg">
            <Flame className="h-4 w-4 text-fsrs-hard" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tabular-nums leading-tight">
              {stats.currentStreak}
            </span>
            <span className="text-[10px] text-muted-foreground">
              day streak
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-fsrs-good-bg">
            <Zap className="h-4 w-4 text-fsrs-good" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tabular-nums leading-tight">
              {stats.longestStreak}
            </span>
            <span className="text-[10px] text-muted-foreground">
              longest
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex flex-col items-end">
            <span className="text-lg font-semibold tabular-nums leading-tight">
              {stats.reviewsToday}
            </span>
            <span className="text-[10px] text-muted-foreground">today</span>
          </div>
        </div>
      </div>

      {/* Activity heatmap */}
      <ActivityHeatmap grid={stats.activityGrid} />
    </Card>
  );
}
