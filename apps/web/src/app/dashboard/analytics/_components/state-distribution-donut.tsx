'use client';

import { useMemo } from 'react';
import { Brain } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface StateDistributionDonutProps {
  distribution: Array<{ state: number; count: number }>;
}

const STATE_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

const STATE_COLORS: Record<number, string> = {
  0: 'var(--sr-new)',
  1: 'var(--sr-due)',
  2: 'var(--sr-recalled)',
  3: 'var(--sr-lapsed)',
};

const chartConfig: ChartConfig = {
  new: { label: 'New', color: 'var(--sr-new)' },
  learning: { label: 'Learning', color: 'var(--sr-due)' },
  review: { label: 'Review', color: 'var(--sr-recalled)' },
  relearning: { label: 'Relearning', color: 'var(--sr-lapsed)' },
};

export function StateDistributionDonut({ distribution }: StateDistributionDonutProps) {
  const { data, total, isEmpty } = useMemo(() => {
    const mapped = distribution.map((d) => ({
      name: STATE_LABELS[d.state] ?? `State ${d.state}`,
      value: d.count,
      fill: STATE_COLORS[d.state] ?? 'var(--muted-foreground)',
    }));
    const sum = mapped.reduce((s, d) => s + d.value, 0);
    return { data: mapped, total: sum, isEmpty: sum === 0 };
  }, [distribution]);

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Item States</h2>
      </div>
      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No items tracked yet
        </div>
      ) : (
        <>
          <div className="relative flex-1 min-h-0">
            <ChartContainer config={chartConfig} className="!aspect-auto h-full w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <span>
                          {name}: {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      )}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xl font-bold tabular-nums">{total.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">total</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground shrink-0">
            {data.map((entry) => (
              <span key={entry.name} className="flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                {entry.name}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
