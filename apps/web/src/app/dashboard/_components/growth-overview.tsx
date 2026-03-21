import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GrowthOverviewStats } from '@/lib/fetchers/dashboard-stats';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trophy,
  Star,
  Shield,
} from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

const RATING_COLORS: Record<number, string> = {
  1: 'bg-fsrs-again',
  2: 'bg-fsrs-hard',
  3: 'bg-fsrs-good',
  4: 'bg-fsrs-easy',
};

function RatingDistributionBar({
  distribution,
}: {
  distribution: { rating: number; count: number }[];
}) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
        <div className="w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full rounded-full overflow-hidden">
        {distribution.map((d) => {
          const pct = (d.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={d.rating}
              className={cn('h-full', RATING_COLORS[d.rating])}
              style={{ width: `${pct}%` }}
              title={`${RATING_LABELS[d.rating]}: ${d.count} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {distribution.map((d) => (
          <span key={d.rating} className="flex items-center gap-0.5">
            <span
              className={cn(
                'inline-block size-1.5 rounded-full',
                RATING_COLORS[d.rating]
              )}
            />
            {RATING_LABELS[d.rating]}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-[11px] font-medium',
        isPositive ? 'text-sr-recalled' : 'text-sr-lapsed'
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(0)}%
    </span>
  );
}

export function GrowthOverview({
  stats,
  className,
}: {
  stats: GrowthOverviewStats;
  className?: string;
}) {
  return (
    <Card className={cn('p-6 rounded-[2.5rem] bg-muted/50', className)}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Growth Overview</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Reviews */}
        <div className="bg-background rounded-xl p-4 flex flex-col gap-1">
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Total Reviews</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {stats.totalReviews.toLocaleString()}
            </span>
            <TrendIndicator value={stats.weekOverWeekTrend} />
          </div>
          <span className="text-[11px] text-muted-foreground">
            vs last 7 days
          </span>
        </div>

        {/* Mastery Rate */}
        <div className="bg-background rounded-xl p-4 flex flex-col gap-1">
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            <span>Mastery Rate</span>
          </div>
          <span className="text-2xl font-bold tabular-nums">
            {stats.masteryRate.toFixed(0)}%
          </span>
          <span className="text-[11px] text-muted-foreground">
            items past learning phase
          </span>
        </div>

        {/* Average Rating */}
        <div className="bg-background rounded-xl p-4 flex flex-col gap-2">
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>Average Rating</span>
          </div>
          <span className="text-2xl font-bold tabular-nums">
            {stats.averageRating.toFixed(1)}
          </span>
          <RatingDistributionBar distribution={stats.ratingDistribution} />
        </div>

        {/* Memory Strength */}
        <div className="bg-background rounded-xl p-4 flex flex-col gap-1">
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Memory Strength</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums">
              {stats.averageStability.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">days avg</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            average stability
          </span>
        </div>
      </div>
    </Card>
  );
}
