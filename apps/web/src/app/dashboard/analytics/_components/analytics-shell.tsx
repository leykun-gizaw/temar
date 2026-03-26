'use client';

import type { AnalyticsData } from '@/lib/fetchers/analytics-stats';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

// Overview
import { OverviewKpiRow } from './overview-kpi-row';
import { ForgettingCurveChart } from './forgetting-curve-chart';
import { StateDistributionDonut } from './state-distribution-donut';
import { ReviewVelocityChart } from './review-velocity-chart';

// Memory
import { StabilityDistribution } from './stability-distribution';
import { DifficultyDistribution } from './difficulty-distribution';
import { RatingTrendChart } from './rating-trend-chart';
import { LapseAnalysis } from './lapse-analysis';

// Content
import { TopicLeaderboard } from './topic-leaderboard';
import { HardestItemsTable } from './hardest-items-table';
import { QuestionTypeBreakdown } from './question-type-breakdown';

// Activity
import { ActivityHeatmapFull } from './activity-heatmap-full';
import { HourlyPatternChart } from './hourly-pattern-chart';
import { WeeklyPatternChart } from './weekly-pattern-chart';
import { CumulativeReviewsChart } from './cumulative-reviews-chart';
import { SessionDurationChart } from './session-duration-chart';

// AI Usage
import { AiUsageOverTime } from './ai-usage-over-time';
import { ModelUsagePie } from './model-usage-pie';
import { OperationTypeBreakdown } from './operation-type-breakdown';
import { CostOverTime } from './cost-over-time';

// Billing
import { BalanceHistoryChart } from './balance-history-chart';
import { SpendingBreakdown } from './spending-breakdown';
import { TransactionTimeline } from './transaction-timeline';

const TRIGGER_CLASS =
  'rounded-full px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm';

const TAB_CONTENT_CLASS = 'flex-1 min-h-0 mt-3';

export function AnalyticsShell({ data }: { data: AnalyticsData }) {
  return (
    <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
      <TabsList className="h-9 bg-muted/60 p-1 rounded-full gap-1 w-fit shrink-0">
        <TabsTrigger value="overview" className={TRIGGER_CLASS}>
          Overview
        </TabsTrigger>
        <TabsTrigger value="memory" className={TRIGGER_CLASS}>
          Memory
        </TabsTrigger>
        <TabsTrigger value="content" className={TRIGGER_CLASS}>
          Content
        </TabsTrigger>
        <TabsTrigger value="activity" className={TRIGGER_CLASS}>
          Activity
        </TabsTrigger>
        <TabsTrigger value="ai-usage" className={TRIGGER_CLASS}>
          AI Usage
        </TabsTrigger>
        <TabsTrigger value="billing" className={TRIGGER_CLASS}>
          Billing
        </TabsTrigger>
      </TabsList>

      {/* ── Overview ── */}
      <TabsContent value="overview" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-[auto_1fr_1fr] gap-3 h-full">
          <OverviewKpiRow
            totalReviews={data.totalReviews}
            masteryRate={data.masteryRate}
            avgStability={data.avgStability}
            avgDifficulty={data.avgDifficulty}
            totalItems={data.totalItems}
          />
          <ForgettingCurveChart items={data.forgettingCurveItems} />
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 min-h-0">
            <StateDistributionDonut distribution={data.stateDistribution} />
            <ReviewVelocityChart data={data.dailyReviews90} />
          </div>
        </div>
      </TabsContent>

      {/* ── Memory (FSRS Deep Dive) ── */}
      <TabsContent value="memory" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-2 gap-3 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <StabilityDistribution data={data.stabilityBuckets} />
            <DifficultyDistribution data={data.difficultyBuckets} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <RatingTrendChart data={data.ratingWeekly} />
            <LapseAnalysis data={data.lapseBuckets} />
          </div>
        </div>
      </TabsContent>

      {/* ── Content Performance ── */}
      <TabsContent value="content" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-[1fr_1fr] gap-3 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <TopicLeaderboard data={data.topicPerformance} />
            <HardestItemsTable data={data.hardestItems} />
          </div>
          <QuestionTypeBreakdown data={data.questionTypeStats} />
        </div>
      </TabsContent>

      {/* ── Activity ── */}
      <TabsContent value="activity" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-[auto_1fr_1fr] gap-3 h-full">
          <ActivityHeatmapFull data={data.dailyReviews365} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <HourlyPatternChart data={data.hourlyPattern} />
            <WeeklyPatternChart data={data.weeklyPattern} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <CumulativeReviewsChart data={data.dailyReviews365} />
            <SessionDurationChart data={data.sessionDuration90} />
          </div>
        </div>
      </TabsContent>

      {/* ── AI Usage ── */}
      <TabsContent value="ai-usage" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-2 gap-3 h-full">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3 min-h-0">
            <AiUsageOverTime data={data.aiDailyUsage} />
            <ModelUsagePie data={data.aiModelBreakdown} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            <CostOverTime data={data.aiDailyUsage} />
            <OperationTypeBreakdown data={data.aiOperationBreakdown} />
          </div>
        </div>
      </TabsContent>

      {/* ── Billing ── */}
      <TabsContent value="billing" className={TAB_CONTENT_CLASS}>
        <div className="grid grid-rows-2 gap-3 h-full">
          <BalanceHistoryChart
            transactions={data.transactions}
            currentBalance={data.currentBalancePasses}
          />
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 min-h-0">
            <SpendingBreakdown data={data.spendingByOperation} />
            <TransactionTimeline data={data.transactions} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
