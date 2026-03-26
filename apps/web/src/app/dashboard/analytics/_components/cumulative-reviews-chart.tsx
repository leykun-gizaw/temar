'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface CumulativeReviewsChartProps {
  data: Array<{ date: string; count: number }>;
}

const chartConfig: ChartConfig = {
  cumulative: { label: 'Total Reviews', color: 'var(--chart-1)' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function CumulativeReviewsChart({ data }: CumulativeReviewsChartProps) {
  const { chartData, total, isEmpty } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], total: 0, isEmpty: true };
    }

    let runningSum = 0;
    const cumulative = data.map((d) => {
      runningSum += d.count;
      return { date: d.date, cumulative: runningSum };
    });

    return {
      chartData: cumulative,
      total: runningSum,
      isEmpty: runningSum === 0,
    };
  }, [data]);

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Cumulative Reviews</span>
        </div>
        {!isEmpty && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No reviews yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
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
              interval={Math.max(0, Math.floor(chartData.length / 12) - 1)}
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
              dataKey="cumulative"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#cumulativeFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
