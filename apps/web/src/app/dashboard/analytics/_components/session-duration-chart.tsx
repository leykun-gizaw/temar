'use client';

import { useMemo } from 'react';
import { Timer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface SessionDurationChartProps {
  data: Array<{ date: string; avgMs: number }>;
}

const chartConfig: ChartConfig = {
  avgMs: { label: 'Avg Duration', color: 'var(--chart-3)' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function msToMinLabel(val: number): string {
  return `${(val / 60000).toFixed(0)}m`;
}

export function SessionDurationChart({ data }: SessionDurationChartProps) {
  const isEmpty = useMemo(
    () => !data || data.length === 0 || data.every((d) => d.avgMs === 0),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Session Duration</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No session data yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sessionFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/30"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={msToMinLabel}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value) => (
                    <span>{msToMinLabel(value as number)}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="avgMs"
              type="monotone"
              stroke="var(--chart-3)"
              strokeWidth={2}
              fill="url(#sessionFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
