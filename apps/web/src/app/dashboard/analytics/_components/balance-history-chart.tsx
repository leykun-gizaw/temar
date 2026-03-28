'use client';

import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Card } from '@temar/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface BalanceHistoryChartProps {
  transactions: Array<{
    id: string;
    date: string;
    deltaPasses: number;
    operationType: string;
    description: string;
  }>;
  currentBalance: number;
}

const chartConfig: ChartConfig = {
  balance: { label: 'Balance', color: 'var(--chart-1)' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BalanceHistoryChart({ transactions, currentBalance }: BalanceHistoryChartProps) {
  const { chartData, isEmpty } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], isEmpty: true };
    }

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    const data = sorted.map((tx) => {
      runningBalance += tx.deltaPasses;
      return { date: tx.date, balance: runningBalance };
    });

    return { chartData: data, isEmpty: false };
  }, [transactions]);

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Balance History</span>
        </div>
        <span className="text-sm font-bold tabular-nums">
          {currentBalance.toLocaleString()} passes
        </span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No transactions yet
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatDate} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value) => <span>{(value as number).toLocaleString()} passes</span>}
                />
              }
            />
            <Area dataKey="balance" type="monotone" stroke="var(--chart-1)" strokeWidth={2} fill="url(#balanceFill)" dot={false} />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
