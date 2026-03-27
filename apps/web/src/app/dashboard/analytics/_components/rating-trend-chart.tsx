'use client';

import { Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface RatingTrendChartProps {
  data: Array<{
    week: string;
    again: number;
    hard: number;
    good: number;
    easy: number;
  }>;
}

const chartConfig = {
  again: { label: 'Again', color: 'var(--fsrs-again)' },
  hard: { label: 'Hard', color: 'var(--fsrs-hard)' },
  good: { label: 'Good', color: 'var(--fsrs-good)' },
  easy: { label: 'Easy', color: 'var(--fsrs-easy)' },
} satisfies ChartConfig;

function formatWeek(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function RatingTrendChart({ data }: RatingTrendChartProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Star className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Rating Trend</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No review history yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="mt-4 h-72 w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/30"
            />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeek}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="again"
              stackId="rating"
              fill="var(--color-again)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="hard"
              stackId="rating"
              fill="var(--color-hard)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="good"
              stackId="rating"
              fill="var(--color-good)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="easy"
              stackId="rating"
              fill="var(--color-easy)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
