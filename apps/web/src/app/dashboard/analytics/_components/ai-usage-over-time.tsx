'use client';

import { useMemo } from 'react';
import { Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface AiUsageOverTimeProps {
  data: Array<{ date: string; passes: number }>;
}

const chartConfig: ChartConfig = {
  passes: { label: 'Passes Used', color: 'var(--chart-1)' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function AiUsageOverTime({ data }: AiUsageOverTimeProps) {
  const isEmpty = useMemo(
    () => !data || data.length === 0 || data.every((d) => d.passes === 0),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0 mb-2">
        <Cpu className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Pass Usage</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No AI usage yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="passesFill" x1="0" y1="0" x2="0" y2="1">
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
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDate(label as string)}
                />
              }
            />
            <Area
              dataKey="passes"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#passesFill)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
