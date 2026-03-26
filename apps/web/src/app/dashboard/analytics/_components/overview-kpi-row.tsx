'use client';

import { BarChart3, Trophy, Shield, Flame, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface OverviewKpiRowProps {
  totalReviews: number;
  masteryRate: number;
  avgStability: number;
  avgDifficulty: number;
  totalItems: number;
}

const kpis = [
  {
    key: 'totalReviews',
    label: 'Total Reviews',
    icon: BarChart3,
    format: (v: number) => v.toLocaleString(),
    subtitle: 'all time',
  },
  {
    key: 'masteryRate',
    label: 'Mastery Rate',
    icon: Trophy,
    format: (v: number) => `${v.toFixed(0)}%`,
    subtitle: 'items past learning',
  },
  {
    key: 'avgStability',
    label: 'Avg Stability',
    icon: Shield,
    format: (v: number) => v.toFixed(1),
    subtitle: 'days avg',
  },
  {
    key: 'avgDifficulty',
    label: 'Avg Difficulty',
    icon: Flame,
    format: (v: number) => v.toFixed(1),
    subtitle: 'out of 10',
  },
  {
    key: 'totalItems',
    label: 'Active Items',
    icon: Brain,
    format: (v: number) => v.toLocaleString(),
    subtitle: 'recall items',
  },
] as const;

export function OverviewKpiRow(props: OverviewKpiRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {kpis.map(({ key, label, icon: Icon, format, subtitle }) => (
        <Card key={key} className="bg-card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
          <div className="text-xl font-bold tabular-nums">
            {format(props[key])}
          </div>
          <div className="text-[10px] text-muted-foreground">{subtitle}</div>
        </Card>
      ))}
    </div>
  );
}
