'use server';

import {
  dbClient,
  recallItem,
  reviewLog,
  eq,
  and,
  gte,
  sql,
  count,
} from '@temar/db-client';

// ── Types ──

export interface GrowthOverviewStats {
  totalReviews: number;
  masteryRate: number; // % of recall items past the learning phase (state >= 2)
  averageRating: number;
  weekOverWeekTrend: number; // positive = more reviews this week vs last
  ratingDistribution: { rating: number; count: number }[];
  averageStability: number; // average stability in days
}

export interface ConsistencyStats {
  currentStreak: number;
  longestStreak: number;
  reviewsToday: number;
  activityGrid: { date: string; count: number }[]; // 84 days (12 weeks)
}

export interface DashboardStats {
  growth: GrowthOverviewStats;
  consistency: ConsistencyStats;
}

// ── Helpers ──

/** Midnight UTC for the given date — matches the SQL `at time zone 'UTC'` extraction. */
function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// ── Fetcher ──

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const eightFourDaysAgo = new Date(todayStart);
  eightFourDaysAgo.setUTCDate(eightFourDaysAgo.getUTCDate() - 83); // 84 days including today

  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  // Run all queries in parallel
  const [
    totalReviewsResult,
    masteryResult,
    totalItemsResult,
    avgRatingResult,
    ratingDistResult,
    avgStabilityResult,
    thisWeekReviews,
    lastWeekReviews,
    activityRows,
    reviewsTodayResult,
  ] = await Promise.all([
    // 1. Total review count for user
    dbClient
      .select({ value: count() })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId)),

    // 2. Items past learning phase (state >= 2 means Review or Relearning)
    dbClient
      .select({ value: count() })
      .from(recallItem)
      .where(and(eq(recallItem.userId, userId), gte(recallItem.state, 2))),

    // 3. Total recall items for mastery percentage
    dbClient
      .select({ value: count() })
      .from(recallItem)
      .where(eq(recallItem.userId, userId)),

    // 4. Average rating
    dbClient
      .select({
        value: sql<number>`coalesce(avg(${reviewLog.rating}), 0)`.as('avg_rating'),
      })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId)),

    // 5. Rating distribution
    dbClient
      .select({
        rating: reviewLog.rating,
        count: count(),
      })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId))
      .groupBy(reviewLog.rating)
      .orderBy(reviewLog.rating),

    // 6. Average stability across all recall items
    dbClient
      .select({
        value: sql<number>`coalesce(avg(${recallItem.stability}), 0)`.as(
          'avg_stability'
        ),
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId)),

    // 7. This week's review count (last 7 days)
    dbClient
      .select({ value: count() })
      .from(reviewLog)
      .where(
        and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, sevenDaysAgo))
      ),

    // 8. Last week's review count (7-14 days ago)
    dbClient
      .select({ value: count() })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, fourteenDaysAgo),
          sql`${reviewLog.reviewedAt} < ${sevenDaysAgo}`
        )
      ),

    // 9. Activity grid: daily review counts for the last 84 days
    dbClient
      .select({
        date: sql<string>`date(${reviewLog.reviewedAt} at time zone 'UTC')`.as(
          'review_date'
        ),
        count: count(),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, eightFourDaysAgo)
        )
      )
      .groupBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`)
      .orderBy(sql`date(${reviewLog.reviewedAt} at time zone 'UTC')`),

    // 10. Reviews today
    dbClient
      .select({ value: count() })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, todayStart)
        )
      ),
  ]);

  // ── Growth Overview ──

  const totalReviews = totalReviewsResult[0]?.value ?? 0;
  const masteredCount = masteryResult[0]?.value ?? 0;
  const totalItems = totalItemsResult[0]?.value ?? 0;
  const masteryRate = totalItems > 0 ? (masteredCount / totalItems) * 100 : 0;
  const averageRating = Number(avgRatingResult[0]?.value ?? 0);
  const averageStability = Number(avgStabilityResult[0]?.value ?? 0);

  const thisWeekCount = thisWeekReviews[0]?.value ?? 0;
  const lastWeekCount = lastWeekReviews[0]?.value ?? 0;
  const weekOverWeekTrend =
    lastWeekCount > 0
      ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
      : thisWeekCount > 0
        ? 100
        : 0;

  // Fill all 4 rating buckets (1-4) even if some have 0
  const ratingMap = new Map(
    ratingDistResult.map((r) => [r.rating, r.count])
  );
  const ratingDistribution = [1, 2, 3, 4].map((rating) => ({
    rating,
    count: ratingMap.get(rating) ?? 0,
  }));

  // ── Consistency ──

  // Build the 84-day activity grid (UTC dates to match the SQL grouping)
  const activityMap = new Map(
    activityRows.map((r) => [r.date, r.count])
  );
  const activityGrid: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    activityGrid.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0 });
  }

  // Compute streaks from the activity grid (consecutive days with count > 0)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of activityGrid) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from today
  for (let i = activityGrid.length - 1; i >= 0; i--) {
    if (activityGrid[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const reviewsToday = reviewsTodayResult[0]?.value ?? 0;

  return {
    growth: {
      totalReviews,
      masteryRate,
      averageRating,
      weekOverWeekTrend,
      ratingDistribution,
      averageStability,
    },
    consistency: {
      currentStreak,
      longestStreak,
      reviewsToday,
      activityGrid,
    },
  };
}
