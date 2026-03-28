'use client';

import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface QuestionTypeBreakdownProps {
  data: Array<{
    questionType: string;
    count: number;
    avgRating: number;
    avgStability: number;
  }>;
}

const chartConfig = {
  count: { label: 'Count', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function formatType(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function QuestionTypeBreakdown({ data }: QuestionTypeBreakdownProps) {
  const isEmpty = !data || data.length === 0;

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: formatType(d.questionType),
      })),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Question Types</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No questions generated yet
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
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
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
                  formatter={(value, _name, item) => (
                    <span>
                      Count: {typeof value === 'number' ? value.toLocaleString() : value}
                      {' | Avg Rating: '}
                      {(item.payload as { avgRating?: number })?.avgRating?.toFixed(1) ?? '—'}
                    </span>
                  )}
                />
              }
            />
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
