'use client';

import { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface SpendingBreakdownProps {
  data: Array<{ operationType: string; totalPasses: number }>;
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function formatOperationType(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export function SpendingBreakdown({ data }: SpendingBreakdownProps) {
  const { chartData, totalPasses, isEmpty, chartConfig } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], totalPasses: 0, isEmpty: true, chartConfig: {} as ChartConfig };
    }

    const mapped = data.map((d, i) => ({
      name: formatOperationType(d.operationType),
      value: d.totalPasses,
      fill: COLORS[i % COLORS.length],
    }));

    const total = data.reduce((sum, d) => sum + d.totalPasses, 0);

    const config: ChartConfig = {};
    data.forEach((d, i) => {
      config[d.operationType] = {
        label: formatOperationType(d.operationType),
        color: COLORS[i % COLORS.length],
      };
    });

    return { chartData: mapped, totalPasses: total, isEmpty: total === 0, chartConfig: config };
  }, [data]);

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0 mb-2">
        <PieChartIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Spending Breakdown</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No spending data yet
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <ChartContainer config={chartConfig} className="!aspect-auto h-full w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>{name}: {typeof value === 'number' ? value.toLocaleString() : value} passes</span>
                    )}
                  />
                }
              />
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xl font-bold tabular-nums">{totalPasses.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">passes spent</div>
            </div>
          </div>
        </div>
      )}
      {!isEmpty && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[11px] text-muted-foreground shrink-0">
          {chartData.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
              {entry.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
