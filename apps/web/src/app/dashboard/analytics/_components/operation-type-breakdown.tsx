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

interface OperationTypeBreakdownProps {
  data: Array<{
    operationType: string;
    requestCount: number;
    passes: number;
  }>;
}

const chartConfig = {
  passes: { label: 'Passes Used', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function formatOperationType(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function OperationTypeBreakdown({ data }: OperationTypeBreakdownProps) {
  const isEmpty = !data || data.length === 0;

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: formatOperationType(d.operationType),
      })),
    [data]
  );

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0 mb-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Operations</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No operations yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <span>
                      {typeof value === 'number' ? value.toLocaleString() : value} passes
                      {' · '}
                      {((item.payload as { requestCount?: number })?.requestCount ?? 0).toLocaleString()} requests
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="passes" fill="var(--color-passes)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
