'use client';

import { useMemo, useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ForgettingCurveChartProps {
  items: Array<{
    id: string;
    stability: number;
    lastReview: string;
    chunkName: string;
    topicName: string;
    topicId: string;
  }>;
}

/** FSRS retrievability formula: R(t) = (1 + t / (9 * S))^(-1) */
function retrievability(t: number, stability: number): number {
  return Math.pow(1 + t / (9 * stability), -1);
}

const CURVE_POINTS = 100;
const MAX_DAYS = 90;
const TOPIC_COLORS = [
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-1)',
];

function generateCurve(stability: number) {
  return Array.from({ length: CURVE_POINTS + 1 }, (_, i) => {
    const t = (i / CURVE_POINTS) * MAX_DAYS;
    return { day: Number(t.toFixed(1)), retention: Number((retrievability(t, stability) * 100).toFixed(1)) };
  });
}

export function ForgettingCurveChart({ items }: ForgettingCurveChartProps) {
  const [selectedTopic, setSelectedTopic] = useState('all');

  const { topicGroups, topicList } = useMemo(() => {
    const groups = new Map<string, { topicName: string; items: typeof items }>();
    for (const item of items) {
      const existing = groups.get(item.topicId);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.topicId, { topicName: item.topicName, items: [item] });
      }
    }
    const sorted = [...groups.entries()]
      .sort((a, b) => b[1].items.length - a[1].items.length)
      .slice(0, 5);
    return {
      topicGroups: sorted,
      topicList: sorted.map(([id, { topicName }]) => ({ id, name: topicName })),
    };
  }, [items]);

  const { curveData, scatterData, chartConfig } = useMemo(() => {
    const filteredItems =
      selectedTopic === 'all'
        ? items
        : items.filter((item) => item.topicId === selectedTopic);

    // Aggregate avg stability
    const avgStability =
      filteredItems.length > 0
        ? filteredItems.reduce((sum, item) => sum + item.stability, 0) / filteredItems.length
        : 1;

    // Generate aggregate curve
    const baseCurve = generateCurve(avgStability);

    // Per-topic curves (only shown in "all" view)
    const topicCurves: Record<string, number[]> = {};
    if (selectedTopic === 'all') {
      for (let ti = 0; ti < topicGroups.length; ti++) {
        const [topicId, { items: topicItems }] = topicGroups[ti];
        const topicAvgStability =
          topicItems.reduce((s, item) => s + item.stability, 0) / topicItems.length;
        const curve = generateCurve(topicAvgStability);
        topicCurves[topicId] = curve.map((p) => p.retention);
      }
    }

    // Merge into single data array
    const merged = baseCurve.map((point, i) => {
      const entry: Record<string, number> = {
        day: point.day,
        retention: point.retention,
      };
      if (selectedTopic === 'all') {
        for (const [topicId] of topicGroups) {
          if (topicCurves[topicId]) {
            entry[`topic_${topicId}`] = topicCurves[topicId][i];
          }
        }
      }
      return entry;
    });

    // Scatter dots: current retention for each item
    const now = Date.now();
    const scatter = filteredItems.map((item) => {
      const tElapsed = (now - new Date(item.lastReview).getTime()) / 86400000;
      const r = retrievability(tElapsed, item.stability) * 100;
      return {
        day: Number(tElapsed.toFixed(1)),
        currentR: Number(r.toFixed(1)),
        name: item.chunkName,
        fill:
          r >= 90
            ? 'hsl(142.1 76.2% 36.3%)' // emerald-500
            : r >= 70
              ? 'hsl(37.7 92.1% 50.2%)' // amber-500
              : 'hsl(346.8 77.2% 49.8%)', // rose-500
      };
    });

    // Chart config
    const config: ChartConfig = {
      retention: { label: 'Avg Retention', color: 'var(--chart-1)' },
    };
    if (selectedTopic === 'all') {
      topicGroups.forEach(([topicId, { topicName }], i) => {
        config[`topic_${topicId}`] = {
          label: topicName,
          color: TOPIC_COLORS[i % TOPIC_COLORS.length],
        };
      });
    }
    config.currentR = { label: 'Current Retention', color: 'var(--chart-1)' };

    return { curveData: merged, scatterData: scatter, chartConfig: config };
  }, [items, selectedTopic, topicGroups]);

  if (items.length === 0) {
    return (
      <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Memory Retention Forecast</h2>
        </div>
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No reviewed items yet. Start reviewing to see your memory retention forecast.
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Memory Retention Forecast</h2>
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topicList.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="!aspect-auto flex-1 min-h-0 w-full">
        <ComposedChart data={curveData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="retentionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const label =
                    name === 'retention'
                      ? 'Avg Retention'
                      : name === 'currentR'
                        ? 'Current Retention'
                        : chartConfig[name as string]?.label ?? name;
                  return (
                    <span>
                      {label}: {typeof value === 'number' ? value.toFixed(1) : value}%
                    </span>
                  );
                }}
              />
            }
          />
          <ReferenceLine
            y={90}
            stroke="var(--muted-foreground)"
            strokeDasharray="6 3"
          />
          <Area
            dataKey="retention"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#retentionFill)"
            dot={false}
            activeDot={false}
          />
          {selectedTopic === 'all' &&
            topicGroups.map(([topicId], i) => (
              <Line
                key={topicId}
                dataKey={`topic_${topicId}`}
                type="monotone"
                stroke={TOPIC_COLORS[i % TOPIC_COLORS.length]}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={false}
              />
            ))}
          <Scatter
            dataKey="currentR"
            data={scatterData}
            fill="var(--chart-1)"
            shape={((props: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  fill={props.payload?.fill}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                />
              );
            }) as any}
          />
        </ComposedChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" /> &ge;90%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-500" /> 70–90%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-rose-500" /> &lt;70%
        </span>
      </div>
    </Card>
  );
}
