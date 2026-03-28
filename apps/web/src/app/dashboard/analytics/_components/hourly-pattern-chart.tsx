'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface HourlyPatternChartProps {
  data: Array<{ hour: number; count: number }>;
}

const chartConfig = {
  count: { label: 'Reviews', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export function HourlyPatternChart({ data }: HourlyPatternChartProps) {
  const isEmpty = useMemo(
    () => !data || data.length === 0 || data.every((d) => d.count === 0),
    [data]
  );

  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatHour(d.hour) })),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Time of Day</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No review data yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/30"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
