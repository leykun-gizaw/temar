'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, Zap, Flame, Sprout } from 'lucide-react';

/**
 * Visual shell component — displays static/placeholder growth metrics.
 * Data will be wired to real backend in a future iteration.
 */
export function GrowthOverview() {
  return (
    <Card className="p-8 rounded-[2.5rem] bg-muted/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Growth Overview</h2>
          <p className="text-xs text-muted-foreground">
            Cognitive stability &amp; retention metrics
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary-foreground" />
            Stability 92%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            Lapses 2/8
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-secondary rounded-full text-secondary-foreground font-semibold text-xs">
            <Sprout className="w-3 h-3" />
            Level 14
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          value="82%"
          label="Retention"
          change="+4%"
          icon={<TrendingUp className="w-4 h-4" />}
          valueColor="text-secondary-foreground"
          iconColor="text-secondary-foreground"
        />
        <MetricCard
          value="42"
          label="Concepts"
          badge="New"
          icon={<Zap className="w-4 h-4" />}
          valueColor="text-primary"
          iconColor="text-primary"
        />
        <MetricCard
          value="12h"
          label="Focus Time"
          badge="Focused"
          icon={<Flame className="w-4 h-4" />}
          valueColor="text-accent-orange"
          iconColor="text-accent-orange"
        />
        <MetricCard
          value="6"
          label="New Trunks"
          icon={<Sprout className="w-4 h-4" />}
          valueColor="text-secondary-foreground"
          iconColor="text-secondary-foreground"
        />
      </div>
    </Card>
  );
}

function MetricCard({
  value,
  label,
  change,
  badge,
  icon,
  valueColor,
  iconColor,
}: {
  value: string;
  label: string;
  change?: string;
  badge?: string;
  icon: React.ReactNode;
  valueColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-background rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        {change && (
          <span className="text-[0.65rem] font-semibold text-secondary-foreground bg-secondary rounded-full px-1.5 py-0.5">
            {change}
          </span>
        )}
        {badge && (
          <span className="text-[0.65rem] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={iconColor}>{icon}</span>
        <span className="uppercase tracking-wider font-medium">{label}</span>
      </div>
    </div>
  );
}
