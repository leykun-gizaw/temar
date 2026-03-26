'use client';

import { Timer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface StabilityDistributionProps {
  data: Array<{ bucket: string; count: number }>;
}

const chartConfig = {
  count: { label: 'Items', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function StabilityDistribution({ data }: StabilityDistributionProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Stability Distribution</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No data yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/30"
            />
            <XAxis
              dataKey="bucket"
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
