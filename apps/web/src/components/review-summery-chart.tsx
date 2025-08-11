'use client';

import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

export const description = 'A pie chart with a legend';

const chartData = [
  {
    review_completion: 'completed',
    count: 300,
    fill: 'var(--color-completed)',
  },
  {
    review_completion: 'rescheduled',
    count: 30,
    fill: 'var(--color-rescheduled)',
  },
  { review_completion: 'missed', count: 10, fill: 'var(--color-missed)' },
];

const chartConfig = {
  completed: { label: 'Completed', color: 'oklch(74% 26% 195deg)' },
  rescheduled: { label: 'Rescheduled', color: 'oklch(87% 36% 86deg)' },
  missed: { label: 'Missed', color: 'oklch(71% 48% 11deg)' },
} satisfies ChartConfig;

export function ChartPieLegend() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Reviews History</CardTitle>
        <CardDescription>Since October 2025</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="review_completion" />
            <ChartLegend
              content={<ChartLegendContent nameKey="review_completion" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
