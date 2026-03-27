'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ReviewVelocityChartProps {
  data: Array<{ date: string; count: number }>;
}

const chartConfig: ChartConfig = {
  count: { label: 'Reviews', color: 'var(--chart-1)' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ReviewVelocityChart({ data }: ReviewVelocityChartProps) {
  const isEmpty = useMemo(
    () => data.length === 0 || data.every((d) => d.count === 0),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Review Velocity</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        Daily reviews over the last 90 days
      </p>
      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No reviews yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
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
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDate(label as string)}
                />
              }
            />
            <Area
              dataKey="count"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#velocityFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
