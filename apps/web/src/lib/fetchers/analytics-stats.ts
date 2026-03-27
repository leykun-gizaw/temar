/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import {
  dbClient,
  recallItem,
  reviewLog,
  chunk,
  note,
  topic,
  aiUsageLog,
  passBalance,
  passTransaction,
  eq,
  and,
  gte,
  sql,
  count,
  desc,
  isNotNull,
} from '@temar/db-client';

// ── Types ──

export interface ForgettingCurveItem {
  id: string;
  stability: number;
  lastReview: string;
  chunkName: string;
  topicName: string;
  topicId: string;
}

export interface StateDistribution {
  state: number;
  count: number;
}

export interface StabilityBucket {
  bucket: string;
  count: number;
}

export interface DifficultyBucket {
  bucket: string;
  count: number;
}

export interface RatingWeekly {
  week: string;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface LapseBucket {
  lapses: string;
  count: number;
}

export interface DailyReviewCount {
  date: string;
  count: number;
}

export interface HourlyPattern {
  hour: number;
  count: number;
}

export interface WeeklyPattern {
  day: number;
  count: number;
}

export interface SessionDurationDaily {
  date: string;
  avgMs: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  itemCount: number;
  avgStability: number;
  avgDifficulty: number;
  totalLapses: number;
  totalReviews: number;
  avgRating: number;
}

export interface HardestItem {
  id: string;
  questionTitle: string | null;
  chunkName: string;
  topicName: string;
  noteName: string;
  difficulty: number;
  lapses: number;
  stability: number;
  reps: number;
}

export interface QuestionTypeStats {
  questionType: string;
  count: number;
  avgRating: number;
  avgStability: number;
}

export interface AiDailyUsage {
  date: string;
  passes: number;
}

export interface AiModelBreakdown {
  modelId: string;
  passes: number;
  requestCount: number;
}

export interface AiOperationBreakdown {
  operationType: string;
  requestCount: number;
  passes: number;
}

export interface TransactionEntry {
  id: string;
  date: string;
  deltaPasses: number;
  operationType: string;
  description: string;
}

export interface SpendingByOperation {
  operationType: string;
  totalPasses: number;
}

export interface AnalyticsData {
  // Overview KPIs
  totalReviews: number;
  totalItems: number;
  masteryRate: number;
  avgStability: number;
  avgDifficulty: number;

  // Forgetting curve
  forgettingCurveItems: ForgettingCurveItem[];

  // State
  stateDistribution: StateDistribution[];

  // Review velocity
  dailyReviews90: DailyReviewCount[];

  // FSRS deep dive
  stabilityBuckets: StabilityBucket[];
  difficultyBuckets: DifficultyBucket[];
  ratingWeekly: RatingWeekly[];
  lapseBuckets: LapseBucket[];

  // Content
  topicPerformance: TopicPerformance[];
  hardestItems: HardestItem[];
  questionTypeStats: QuestionTypeStats[];

  // Activity
  dailyReviews365: DailyReviewCount[];
  hourlyPattern: HourlyPattern[];
  weeklyPattern: WeeklyPattern[];
  sessionDuration90: SessionDurationDaily[];

  // AI
  aiDailyUsage: AiDailyUsage[];
  aiModelBreakdown: AiModelBreakdown[];
  aiOperationBreakdown: AiOperationBreakdown[];

  // Billing
  currentBalancePasses: number;
  transactions: TransactionEntry[];
  spendingByOperation: SpendingByOperation[];
}

// ── Helpers ──

/** Midnight UTC for the given date -- matches the SQL `at time zone 'UTC'` extraction. */
function startOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Fill missing dates in a time-series with count 0. */
function fillDailyGaps(
  rows: { date: string; count: number }[],
  from: Date,
  to: Date
): DailyReviewCount[] {
  const map = new Map(rows.map((r: any) => [r.date, r.count]));
  const result: DailyReviewCount[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dateStr = cursor.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/** Fill missing dates in a session-duration time-series with avgMs 0. */
function fillDailyGapsAvg(
  rows: { date: string; avgMs: number }[],
  from: Date,
  to: Date
): SessionDurationDaily[] {
  const map = new Map(rows.map((r: any) => [r.date, r.avgMs]));
  const result: SessionDurationDaily[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dateStr = cursor.toISOString().slice(0, 10);
    result.push({ date: dateStr, avgMs: map.get(dateStr) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/** Convert USD to pass count. 1 pass = $0.05 by default. */
function usdToPasses(usd: number): number {
  const costPerPass = parseFloat(process.env['COST_PER_PASS_USD'] ?? '') || 0.05;
  return Math.floor(usd / costPerPass);
}

/** Fill missing dates in AI daily usage with zeros (converted to passes). */
function fillDailyGapsAi(
  rows: { date: string; costUsd: number }[],
  from: Date,
  to: Date
): AiDailyUsage[] {
  const map = new Map(rows.map((r: any) => [r.date, r.costUsd]));
  const result: AiDailyUsage[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dateStr = cursor.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      passes: usdToPasses(map.get(dateStr) ?? 0),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// ── Fetcher ──

export async function getAnalyticsData(
  userId: string
): Promise<AnalyticsData> {
  const now = new Date();
  const todayStart = startOfDayUTC(now);

  const ninetyDaysAgo = new Date(todayStart);
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);

  const threeSixtyFiveDaysAgo = new Date(todayStart);
  threeSixtyFiveDaysAgo.setUTCDate(threeSixtyFiveDaysAgo.getUTCDate() - 364);

  const twelveWeeksAgo = new Date(todayStart);
  twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - 83); // 12 weeks = 84 days

  // Run all queries in parallel
  const [
    // 1. Overview KPIs
    totalReviewsResult,
    masteryAndAvgsResult,
    totalItemsResult,

    // 2. Forgetting curve
    forgettingCurveResult,

    // 3. State distribution
    stateDistResult,

    // 4. Stability buckets
    stabilityBucketResult,

    // 5. Difficulty buckets
    difficultyBucketResult,

    // 6. Lapse buckets
    lapseBucketResult,

    // 7. Daily reviews 90d
    dailyReviews90Result,

    // 8. Daily reviews 365d
    dailyReviews365Result,

    // 9. Rating weekly
    ratingWeeklyResult,

    // 10. Hourly pattern
    hourlyPatternResult,

    // 11. Weekly pattern
    weeklyPatternResult,

    // 12. Session duration 90d
    sessionDuration90Result,

    // 13. Topic performance - item metrics
    topicItemMetricsResult,

    // 14. Topic performance - avg rating
    topicAvgRatingResult,

    // 15. Hardest items
    hardestItemsResult,

    // 16. Question type stats - from recall_item
    questionTypeItemResult,

    // 17. Question type stats - avg rating from review_log
    questionTypeRatingResult,

    // 18. AI daily usage
    aiDailyUsageResult,

    // 19. AI model breakdown
    aiModelBreakdownResult,

    // 20. AI operation breakdown
    aiOperationBreakdownResult,

    // 21. Current balance
    currentBalanceResult,

    // 23. Transactions
    transactionsResult,

    // 24. Spending by operation
    spendingByOperationResult,
  ] = await Promise.all([
    // 1. Total review count
    dbClient
      .select({ value: count() })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId)),

    // 2. Mastery rate + average stability + average difficulty (combined)
    dbClient
      .select({
        masteredCount:
          sql<number>`count(*) FILTER (WHERE ${recallItem.state} >= 2)`.as(
            'mastered_count'
          ),
        avgStability:
          sql<number>`coalesce(round(avg(${recallItem.stability})::numeric, 2)::float, 0)`.as(
            'avg_stability'
          ),
        avgDifficulty:
          sql<number>`coalesce(round(avg(${recallItem.difficulty})::numeric, 2)::float, 0)`.as(
            'avg_difficulty'
          ),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId)),

    // 3. Total recall items
    dbClient
      .select({ value: count() })
      .from(recallItem)
      .where(eq(recallItem.userId, userId)),

    // 4. Forgetting curve items
    dbClient
      .select({
        id: recallItem.id,
        stability: recallItem.stability,
        lastReview:
          sql<string>`${recallItem.lastReview}::text`.as('last_review_text'),
        chunkName: chunk.name,
        topicName: topic.name,
        topicId: topic.id,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(
        and(
          eq(recallItem.userId, userId),
          isNotNull(recallItem.lastReview),
          sql`${recallItem.stability} > 0`
        )
      )
      .limit(200),

    // 5. State distribution
    dbClient
      .select({
        state: recallItem.state,
        count: sql<number>`count(*)::int`.as('state_count'),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId))
      .groupBy(recallItem.state)
      .orderBy(recallItem.state),

    // 6. Stability buckets
    dbClient
      .select({
        bucket: sql<string>`
          CASE
            WHEN ${recallItem.stability} < 1 THEN '< 1 day'
            WHEN ${recallItem.stability} < 7 THEN '1-7 days'
            WHEN ${recallItem.stability} < 30 THEN '7-30 days'
            WHEN ${recallItem.stability} < 90 THEN '30-90 days'
            ELSE '90+ days'
          END
        `.as('stability_bucket'),
        count: sql<number>`count(*)::int`.as('stability_count'),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId))
      .groupBy(
        sql`CASE
          WHEN ${recallItem.stability} < 1 THEN '< 1 day'
          WHEN ${recallItem.stability} < 7 THEN '1-7 days'
          WHEN ${recallItem.stability} < 30 THEN '7-30 days'
          WHEN ${recallItem.stability} < 90 THEN '30-90 days'
          ELSE '90+ days'
        END`
      ),

    // 7. Difficulty buckets
    dbClient
      .select({
        bucket: sql<string>`
          CASE
            WHEN floor(${recallItem.difficulty}) >= 9 THEN '9-10'
            ELSE floor(${recallItem.difficulty})::int::text || '-' || (floor(${recallItem.difficulty})::int + 1)::text
          END
        `.as('difficulty_bucket'),
        count: sql<number>`count(*)::int`.as('difficulty_count'),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId))
      .groupBy(
        sql`CASE
          WHEN floor(${recallItem.difficulty}) >= 9 THEN '9-10'
          ELSE floor(${recallItem.difficulty})::int::text || '-' || (floor(${recallItem.difficulty})::int + 1)::text
        END`
      ),

    // 8. Lapse buckets
    dbClient
      .select({
        lapses: sql<string>`
          CASE WHEN ${recallItem.lapses} >= 5 THEN '5+' ELSE ${recallItem.lapses}::text END
        `.as('lapse_bucket'),
        count: sql<number>`count(*)::int`.as('lapse_count'),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId))
      .groupBy(
        sql`CASE WHEN ${recallItem.lapses} >= 5 THEN '5+' ELSE ${recallItem.lapses}::text END`
      ),

    // 9. Daily reviews (90 days)
    dbClient
      .select({
        date: sql<string>`date(${reviewLog.reviewedAt} at time zone 'UTC')`.as(
          'review_date_90'
        ),
        count: sql<number>`count(*)::int`.as('daily_count_90'),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, ninetyDaysAgo)
        )
      )
      .groupBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`)
      .orderBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`),

    // 10. Daily reviews (365 days)
    dbClient
      .select({
        date: sql<string>`date(${reviewLog.reviewedAt} at time zone 'UTC')`.as(
          'review_date_365'
        ),
        count: sql<number>`count(*)::int`.as('daily_count_365'),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, threeSixtyFiveDaysAgo)
        )
      )
      .groupBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`)
      .orderBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`),

    // 11. Rating weekly (12 weeks)
    dbClient
      .select({
        week: sql<string>`date_trunc('week', ${reviewLog.reviewedAt} at time zone 'UTC')::date::text`.as(
          'review_week'
        ),
        again:
          sql<number>`count(*) FILTER (WHERE ${reviewLog.rating} = 1)::int`.as(
            'again_count'
          ),
        hard:
          sql<number>`count(*) FILTER (WHERE ${reviewLog.rating} = 2)::int`.as(
            'hard_count'
          ),
        good:
          sql<number>`count(*) FILTER (WHERE ${reviewLog.rating} = 3)::int`.as(
            'good_count'
          ),
        easy:
          sql<number>`count(*) FILTER (WHERE ${reviewLog.rating} = 4)::int`.as(
            'easy_count'
          ),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, twelveWeeksAgo)
        )
      )
      .groupBy(
        sql`date_trunc('week', ${reviewLog.reviewedAt} at time zone 'UTC')`
      )
      .orderBy(
        sql`date_trunc('week', ${reviewLog.reviewedAt} at time zone 'UTC')`
      ),

    // 12. Hourly pattern
    dbClient
      .select({
        hour: sql<number>`extract(hour from ${reviewLog.reviewedAt})::int`.as(
          'review_hour'
        ),
        count: sql<number>`count(*)::int`.as('hourly_count'),
      })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId))
      .groupBy(sql`extract(hour from ${reviewLog.reviewedAt})`)
      .orderBy(sql`extract(hour from ${reviewLog.reviewedAt})`),

    // 13. Weekly pattern (day of week)
    dbClient
      .select({
        day: sql<number>`extract(dow from ${reviewLog.reviewedAt})::int`.as(
          'review_dow'
        ),
        count: sql<number>`count(*)::int`.as('weekly_count'),
      })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId))
      .groupBy(sql`extract(dow from ${reviewLog.reviewedAt})`)
      .orderBy(sql`extract(dow from ${reviewLog.reviewedAt})`),

    // 14. Session duration (90 days)
    dbClient
      .select({
        date: sql<string>`date(${reviewLog.reviewedAt} at time zone 'UTC')`.as(
          'session_date'
        ),
        avgMs:
          sql<number>`coalesce(round(avg(${reviewLog.durationMs})::numeric)::int, 0)`.as(
            'avg_duration_ms'
          ),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          isNotNull(reviewLog.durationMs),
          gte(reviewLog.reviewedAt, ninetyDaysAgo)
        )
      )
      .groupBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`)
      .orderBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`),

    // 15. Topic performance - item metrics
    dbClient
      .select({
        topicId: topic.id,
        topicName: topic.name,
        itemCount: sql<number>`count(${recallItem.id})::int`.as(
          'topic_item_count'
        ),
        avgStability:
          sql<number>`coalesce(round(avg(${recallItem.stability})::numeric, 1)::float, 0)`.as(
            'topic_avg_stability'
          ),
        avgDifficulty:
          sql<number>`coalesce(round(avg(${recallItem.difficulty})::numeric, 1)::float, 0)`.as(
            'topic_avg_difficulty'
          ),
        totalLapses:
          sql<number>`coalesce(sum(${recallItem.lapses})::int, 0)`.as(
            'topic_total_lapses'
          ),
        totalReviews:
          sql<number>`coalesce(sum(${recallItem.reps})::int, 0)`.as(
            'topic_total_reviews'
          ),
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(eq(recallItem.userId, userId))
      .groupBy(topic.id, topic.name)
      .orderBy(sql`avg(${recallItem.difficulty}) DESC`),

    // 16. Topic performance - avg rating per topic
    dbClient
      .select({
        topicId: topic.id,
        avgRating:
          sql<number>`coalesce(round(avg(${reviewLog.rating})::numeric, 1)::float, 0)`.as(
            'topic_avg_rating'
          ),
      })
      .from(reviewLog)
      .innerJoin(recallItem, eq(reviewLog.recallItemId, recallItem.id))
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(eq(reviewLog.userId, userId))
      .groupBy(topic.id),

    // 17. Hardest items (top 20)
    dbClient
      .select({
        id: recallItem.id,
        questionTitle: recallItem.questionTitle,
        chunkName: chunk.name,
        topicName: topic.name,
        noteName: note.name,
        difficulty: recallItem.difficulty,
        lapses: recallItem.lapses,
        stability: recallItem.stability,
        reps: recallItem.reps,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(eq(recallItem.userId, userId))
      .orderBy(desc(recallItem.difficulty), desc(recallItem.lapses))
      .limit(20),

    // 18. Question type stats - item metrics
    dbClient
      .select({
        questionType:
          sql<string>`coalesce(${recallItem.questionType}, 'unknown')`.as(
            'qt_type'
          ),
        count: sql<number>`count(*)::int`.as('qt_count'),
        avgStability:
          sql<number>`coalesce(round(avg(${recallItem.stability})::numeric, 1)::float, 0)`.as(
            'qt_avg_stability'
          ),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId))
      .groupBy(sql`coalesce(${recallItem.questionType}, 'unknown')`),

    // 19. Question type stats - avg rating per question type
    dbClient
      .select({
        questionType:
          sql<string>`coalesce(${recallItem.questionType}, 'unknown')`.as(
            'qt_rating_type'
          ),
        avgRating:
          sql<number>`coalesce(round(avg(${reviewLog.rating})::numeric, 1)::float, 0)`.as(
            'qt_avg_rating'
          ),
      })
      .from(reviewLog)
      .innerJoin(recallItem, eq(reviewLog.recallItemId, recallItem.id))
      .where(eq(reviewLog.userId, userId))
      .groupBy(sql`coalesce(${recallItem.questionType}, 'unknown')`),

    // 20. AI daily usage (90 days)
    dbClient
      .select({
        date: sql<string>`date(${aiUsageLog.createdAt} at time zone 'UTC')`.as(
          'ai_date'
        ),
        inputTokens:
          sql<number>`coalesce(sum(${aiUsageLog.inputTokens})::int, 0)`.as(
            'ai_input_tokens'
          ),
        outputTokens:
          sql<number>`coalesce(sum(${aiUsageLog.outputTokens})::int, 0)`.as(
            'ai_output_tokens'
          ),
        costUsd:
          sql<number>`coalesce(round(sum(${aiUsageLog.amountChargedUsd})::numeric, 4)::float, 0)`.as(
            'ai_cost_usd'
          ),
      })
      .from(aiUsageLog)
      .where(
        and(
          eq(aiUsageLog.userId, userId),
          gte(aiUsageLog.createdAt, ninetyDaysAgo)
        )
      )
      .groupBy(sql`date(${aiUsageLog.createdAt} at time zone 'UTC')`)
      .orderBy(sql`date(${aiUsageLog.createdAt} at time zone 'UTC')`),

    // 21. AI model breakdown
    dbClient
      .select({
        modelId: aiUsageLog.modelId,
        totalTokens:
          sql<number>`coalesce(sum(${aiUsageLog.inputTokens} + ${aiUsageLog.outputTokens})::int, 0)`.as(
            'model_total_tokens'
          ),
        totalCostUsd:
          sql<number>`coalesce(round(sum(${aiUsageLog.amountChargedUsd})::numeric, 4)::float, 0)`.as(
            'model_total_cost'
          ),
        requestCount: sql<number>`count(*)::int`.as('model_request_count'),
      })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, userId))
      .groupBy(aiUsageLog.modelId)
      .orderBy(sql`sum(${aiUsageLog.amountChargedUsd}) DESC`),

    // 22. AI operation breakdown
    dbClient
      .select({
        operationType: aiUsageLog.operationType,
        requestCount: sql<number>`count(*)::int`.as('op_request_count'),
        totalTokens:
          sql<number>`coalesce(sum(${aiUsageLog.inputTokens} + ${aiUsageLog.outputTokens})::int, 0)`.as(
            'op_total_tokens'
          ),
        totalCostUsd:
          sql<number>`coalesce(round(sum(${aiUsageLog.amountChargedUsd})::numeric, 4)::float, 0)`.as(
            'op_total_cost'
          ),
      })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, userId))
      .groupBy(aiUsageLog.operationType)
      .orderBy(sql`sum(${aiUsageLog.amountChargedUsd}) DESC`),

    // 22. Current balance
    dbClient
      .select({
        balanceUsd: passBalance.balanceUsd,
        topupBalanceUsd: passBalance.topupBalanceUsd,
      })
      .from(passBalance)
      .where(eq(passBalance.userId, userId)),

    // 25. Recent transactions (last 50)
    dbClient
      .select({
        id: passTransaction.id,
        date: sql<string>`${passTransaction.createdAt}::text`.as(
          'transaction_date'
        ),
        deltaUsd: passTransaction.deltaUsd,
        operationType: passTransaction.operationType,
        description: passTransaction.description,
      })
      .from(passTransaction)
      .where(eq(passTransaction.userId, userId))
      .orderBy(desc(passTransaction.createdAt))
      .limit(50),

    // 26. Spending by operation (from pass_transaction, negative deltas = spending)
    dbClient
      .select({
        operationType: passTransaction.operationType,
        totalUsd:
          sql<number>`coalesce(round(abs(sum(${passTransaction.deltaUsd}))::numeric, 4)::float, 0)`.as(
            'spending_total'
          ),
      })
      .from(passTransaction)
      .where(
        and(
          eq(passTransaction.userId, userId),
          sql`${passTransaction.deltaUsd} < 0`
        )
      )
      .groupBy(passTransaction.operationType)
      .orderBy(sql`abs(sum(${passTransaction.deltaUsd})) DESC`),
  ]);

  // ── Overview KPIs ──

  const totalReviews = totalReviewsResult[0]?.value ?? 0;
  const totalItems = totalItemsResult[0]?.value ?? 0;
  const masteredCount = Number(masteryAndAvgsResult[0]?.masteredCount ?? 0);
  const masteryRate =
    totalItems > 0 ? Math.round((masteredCount / totalItems) * 100) : 0;
  const avgStability = Number(masteryAndAvgsResult[0]?.avgStability ?? 0);
  const avgDifficulty = Number(masteryAndAvgsResult[0]?.avgDifficulty ?? 0);

  // ── Forgetting curve ──

  const forgettingCurveItems: ForgettingCurveItem[] = forgettingCurveResult.map(
    (r: any) => ({
      id: r.id,
      stability: r.stability,
      lastReview: r.lastReview,
      chunkName: r.chunkName,
      topicName: r.topicName,
      topicId: r.topicId,
    })
  );

  // ── State distribution (fill all 4 states: 0=New, 1=Learning, 2=Review, 3=Relearning) ──

  const stateMap = new Map<number, number>(
    stateDistResult.map((r: any) => [r.state, Number(r.count)])
  );
  const stateDistribution: StateDistribution[] = [0, 1, 2, 3].map(
    (state) => ({
      state,
      count: stateMap.get(state) ?? 0,
    })
  );

  // ── Stability buckets (ordered) ──

  const stabilityOrder = [
    '< 1 day',
    '1-7 days',
    '7-30 days',
    '30-90 days',
    '90+ days',
  ];
  const stabilityMap = new Map<string, number>(
    stabilityBucketResult.map((r: any) => [r.bucket, Number(r.count)])
  );
  const stabilityBuckets: StabilityBucket[] = stabilityOrder.map((bucket) => ({
    bucket,
    count: stabilityMap.get(bucket) ?? 0,
  }));

  // ── Difficulty buckets (ordered 0-10) ──

  const difficultyOrder = [
    '0-1',
    '1-2',
    '2-3',
    '3-4',
    '4-5',
    '5-6',
    '6-7',
    '7-8',
    '8-9',
    '9-10',
  ];
  const difficultyMap = new Map<string, number>(
    difficultyBucketResult.map((r: any) => [r.bucket, Number(r.count)])
  );
  const difficultyBuckets: DifficultyBucket[] = difficultyOrder.map(
    (bucket) => ({
      bucket,
      count: difficultyMap.get(bucket) ?? 0,
    })
  );

  // ── Lapse buckets (ordered) ──

  const lapseOrder = ['0', '1', '2', '3', '4', '5+'];
  const lapseMap = new Map<string, number>(
    lapseBucketResult.map((r: any) => [r.lapses, Number(r.count)])
  );
  const lapseBuckets: LapseBucket[] = lapseOrder.map((lapses) => ({
    lapses,
    count: lapseMap.get(lapses) ?? 0,
  }));

  // ── Daily reviews (90d, gap-filled) ──

  const dailyReviews90 = fillDailyGaps(
    dailyReviews90Result.map((r: any) => ({ date: r.date, count: r.count })),
    ninetyDaysAgo,
    todayStart
  );

  // ── Daily reviews (365d, gap-filled) ──

  const dailyReviews365 = fillDailyGaps(
    dailyReviews365Result.map((r: any) => ({ date: r.date, count: r.count })),
    threeSixtyFiveDaysAgo,
    todayStart
  );

  // ── Rating weekly ──

  const ratingWeekly: RatingWeekly[] = ratingWeeklyResult.map((r: any) => ({
    week: r.week,
    again: r.again,
    hard: r.hard,
    good: r.good,
    easy: r.easy,
  }));

  // ── Hourly pattern (fill all 24 hours) ──

  const hourlyMap = new Map<number, number>(
    hourlyPatternResult.map((r: any) => [r.hour, Number(r.count)])
  );
  const hourlyPattern: HourlyPattern[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyMap.get(i) ?? 0,
  }));

  // ── Weekly pattern (fill all 7 days, 0=Sunday) ──

  const weeklyMap = new Map<number, number>(
    weeklyPatternResult.map((r: any) => [r.day, Number(r.count)])
  );
  const weeklyPattern: WeeklyPattern[] = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    count: weeklyMap.get(i) ?? 0,
  }));

  // ── Session duration (90d, gap-filled) ──

  const sessionDuration90 = fillDailyGapsAvg(
    sessionDuration90Result.map((r: any) => ({ date: r.date, avgMs: r.avgMs })),
    ninetyDaysAgo,
    todayStart
  );

  // ── Topic performance (merge item metrics + avg rating) ──

  const topicRatingMap = new Map(
    topicAvgRatingResult.map((r: any) => [r.topicId, r.avgRating])
  );
  const topicPerformance: TopicPerformance[] = topicItemMetricsResult.map(
    (r: any) => ({
      topicId: r.topicId,
      topicName: r.topicName,
      itemCount: r.itemCount,
      avgStability: r.avgStability,
      avgDifficulty: r.avgDifficulty,
      totalLapses: r.totalLapses,
      totalReviews: r.totalReviews,
      avgRating: topicRatingMap.get(r.topicId) ?? 0,
    })
  );

  // ── Hardest items ──

  const hardestItems: HardestItem[] = hardestItemsResult.map((r: any) => ({
    id: r.id,
    questionTitle: r.questionTitle,
    chunkName: r.chunkName,
    topicName: r.topicName,
    noteName: r.noteName,
    difficulty: r.difficulty,
    lapses: r.lapses,
    stability: r.stability,
    reps: r.reps,
  }));

  // ── Question type stats (merge item metrics + avg rating) ──

  const qtRatingMap = new Map(
    questionTypeRatingResult.map((r: any) => [r.questionType, r.avgRating])
  );
  const questionTypeStats: QuestionTypeStats[] = questionTypeItemResult.map(
    (r: any) => ({
      questionType: r.questionType,
      count: r.count,
      avgRating: qtRatingMap.get(r.questionType) ?? 0,
      avgStability: r.avgStability,
    })
  );

  // ── AI daily usage (90d, gap-filled, in passes) ──

  const aiDailyUsage = fillDailyGapsAi(
    aiDailyUsageResult.map((r: any) => ({
      date: r.date,
      costUsd: Number(r.costUsd ?? 0),
    })),
    ninetyDaysAgo,
    todayStart
  );

  // ── AI model breakdown (in passes) ──

  const aiModelBreakdown: AiModelBreakdown[] = aiModelBreakdownResult.map(
    (r: any) => ({
      modelId: r.modelId,
      passes: usdToPasses(Number(r.totalCostUsd ?? 0)),
      requestCount: r.requestCount,
    })
  );

  // ── AI operation breakdown (in passes) ──

  const aiOperationBreakdown: AiOperationBreakdown[] =
    aiOperationBreakdownResult.map((r: any) => ({
      operationType: r.operationType,
      requestCount: r.requestCount,
      passes: usdToPasses(Number(r.totalCostUsd ?? 0)),
    }));

  // ── Billing (in passes) ──

  const balanceRow = currentBalanceResult[0];
  const currentBalancePasses = usdToPasses(
    (balanceRow?.balanceUsd ?? 0) + (balanceRow?.topupBalanceUsd ?? 0)
  );

  const transactions: TransactionEntry[] = transactionsResult.map((r: any) => ({
    id: r.id,
    date: r.date,
    deltaPasses: usdToPasses(Math.abs(Number(r.deltaUsd ?? 0))) * (Number(r.deltaUsd ?? 0) >= 0 ? 1 : -1),
    operationType: r.operationType,
    description: r.description,
  }));

  const spendingByOperation: SpendingByOperation[] =
    spendingByOperationResult.map((r: any) => ({
      operationType: r.operationType,
      totalPasses: usdToPasses(Math.abs(Number(r.totalUsd ?? 0))),
    }));

  return {
    // Overview KPIs
    totalReviews,
    totalItems,
    masteryRate,
    avgStability,
    avgDifficulty,

    // Forgetting curve
    forgettingCurveItems,

    // State
    stateDistribution,

    // Review velocity
    dailyReviews90,

    // FSRS deep dive
    stabilityBuckets,
    difficultyBuckets,
    ratingWeekly,
    lapseBuckets,

    // Content
    topicPerformance,
    hardestItems,
    questionTypeStats,

    // Activity
    dailyReviews365,
    hourlyPattern,
    weeklyPattern,
    sessionDuration90,

    // AI
    aiDailyUsage,
    aiModelBreakdown,
    aiOperationBreakdown,

    // Billing
    currentBalancePasses,
    transactions,
    spendingByOperation,
  };
}
