import { Injectable, Logger } from '@nestjs/common';
import {
  dbClient,
  recallItem,
  reviewLog,
  chunk,
  note,
  topic,
  chunkTracking,
  user,
  recallItemArchive,
  eq,
  ne,
  and,
  lte,
  sql,
  count,
  desc,
  inArray,
  pgNotify,
} from '@temar/db-client';

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

@Injectable()
export class RecallItemService {
  private readonly logger = new Logger(RecallItemService.name);

  async trackChunk(
    chunkId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    },
    questionTypes?: string[],
    questionCount?: number
  ) {
    try {
      // Check if there's an existing untracked row to reactivate
      const [existing] = await dbClient
        .select({
          id: chunkTracking.id,
          status: chunkTracking.status,
        })
        .from(chunkTracking)
        .where(
          and(
            eq(chunkTracking.chunkId, chunkId),
            eq(chunkTracking.userId, userId)
          )
        )
        .limit(1);

      if (existing) {
        if (existing.status === 'untracked') {
          // Reactivate: flip back to 'ready' since recall items are still intact
          await dbClient
            .update(chunkTracking)
            .set({ status: 'ready' })
            .where(eq(chunkTracking.id, existing.id));
          this.logger.log(
            `Reactivated chunk ${chunkId} for user ${userId} (preserved FSRS state)`
          );
          return { tracked: true, chunkId, reactivated: true, status: 'ready' };
        }
        this.logger.log(`Chunk ${chunkId} already tracked for user ${userId}`);
        return { tracked: false, chunkId, reason: 'already_tracked' };
      }

      const [row] = await dbClient
        .insert(chunkTracking)
        .values({ chunkId, userId, status: 'pending' })
        .onConflictDoNothing()
        .returning({ id: chunkTracking.id });

      if (!row) {
        this.logger.log(`Chunk ${chunkId} already tracked for user ${userId}`);
        return { tracked: false, chunkId, reason: 'already_tracked' };
      }

      this.logger.log(
        `Tracked chunk ${chunkId} for user ${userId} (pending generation)`
      );

      // Notify frontend that a chunk entered pending state
      const [chunkRow] = await dbClient
        .select({ name: chunk.name })
        .from(chunk)
        .where(eq(chunk.id, chunkId))
        .limit(1);
      void pgNotify(userId, {
        type: 'generation:status',
        chunkId,
        chunkName: chunkRow?.name ?? '',
        status: 'pending',
      }).catch(() => { /* noop */ });

      // Fire-and-forget: trigger question generation in the background.
      // The question-gen-service updates chunk_tracking status and sends
      // a pg_notify event when done — the frontend picks it up via SSE.
      void this.triggerQuestionGen(
        chunkId,
        userId,
        aiConfig,
        questionTypes,
        questionCount
      ).catch((err) => {
        this.logger.error(
          `Background question gen failed for chunk ${chunkId}: ${err}`
        );
      });

      return {
        tracked: true,
        chunkId,
        trackingId: row.id,
        status: 'pending',
      };
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes('chunk_tracking_chunk_user_idx')
      ) {
        this.logger.log(`Chunk ${chunkId} already tracked for user ${userId}`);
        return { tracked: false, chunkId, reason: 'already_tracked' };
      }
      throw err;
    }
  }

  async trackNote(
    noteId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    },
    questionTypes?: string[],
    questionCount?: number
  ) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(and(eq(chunk.noteId, noteId), eq(chunk.userId, userId)));

    const results = await Promise.all(
      chunks.map((c) =>
        this.trackChunk(c.id, userId, aiConfig, questionTypes, questionCount)
      )
    );

    this.logger.log(
      `Tracked note ${noteId}: ${results.filter((r) => r.tracked).length}/${
        chunks.length
      } chunks`
    );
    return { noteId, results };
  }

  async trackTopic(
    topicId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    },
    questionTypes?: string[],
    questionCount?: number
  ) {
    const notes = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(and(eq(note.topicId, topicId), eq(note.userId, userId)));

    const results = await Promise.all(
      notes.map((n) =>
        this.trackNote(n.id, userId, aiConfig, questionTypes, questionCount)
      )
    );

    this.logger.log(`Tracked topic ${topicId}: ${notes.length} notes`);
    return { topicId, results };
  }

  async untrackChunk(chunkId: string, userId: string) {
    // Soft-delete: mark as untracked instead of deleting rows
    // This preserves recall_item FSRS state and review_log history
    const updated = await dbClient
      .update(chunkTracking)
      .set({ status: 'untracked' })
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      )
      .returning({ id: chunkTracking.id });
    return { untracked: updated.length > 0, chunkId };
  }

  async untrackNote(noteId: string, userId: string) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(and(eq(chunk.noteId, noteId), eq(chunk.userId, userId)));

    let count = 0;
    for (const c of chunks) {
      const result = await this.untrackChunk(c.id, userId);
      if (result.untracked) count++;
    }
    return { noteId, untrackedCount: count };
  }

  async untrackTopic(topicId: string, userId: string) {
    const notes = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(and(eq(note.topicId, topicId), eq(note.userId, userId)));

    let count = 0;
    for (const n of notes) {
      const result = await this.untrackNote(n.id, userId);
      count += result.untrackedCount;
    }
    return { topicId, untrackedCount: count };
  }

  async getAllItems(
    userId: string,
    options?: { search?: string; limit?: number; offset?: number }
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const rows = await dbClient
      .select({
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
        questionTitle: recallItem.questionTitle,
        questionText: recallItem.questionText,
        questionType: recallItem.questionType,
        answerRubric: recallItem.answerRubric,
        chunkName: chunk.name,
        chunkContentMd: chunk.contentMd,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          ne(chunkTracking.status, 'untracked')
        )
      )
      .orderBy(recallItem.due)
      .limit(limit)
      .offset(offset);

    const [countResult] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(recallItem)
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          ne(chunkTracking.status, 'untracked')
        )
      );

    return { items: rows, total: countResult?.count ?? 0 };
  }

  async searchItems(userId: string, search: string) {
    const rows = await dbClient
      .select({
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
        questionTitle: recallItem.questionTitle,
        questionText: recallItem.questionText,
        questionType: recallItem.questionType,
        answerRubric: recallItem.answerRubric,
        chunkName: chunk.name,
        chunkContentMd: chunk.contentMd,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          ne(chunkTracking.status, 'untracked')
        )
      )
      .orderBy(recallItem.due);

    const lowerSearch = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.chunkName.toLowerCase().includes(lowerSearch) ||
        r.noteName.toLowerCase().includes(lowerSearch) ||
        r.topicName.toLowerCase().includes(lowerSearch)
    );
  }

  async getDueItems(
    userId: string,
    options?: { topicId?: string; noteId?: string; limit?: number }
  ) {
    const now = new Date();
    const limit = options?.limit ?? 50;

    let query = dbClient
      .select({
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        state: recallItem.state,
        due: recallItem.due,
        chunkContentUpdatedAt: chunk.contentUpdatedAt,
        chunkContentCreatedAt: chunk.createdAt,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
        questionTitle: recallItem.questionTitle,
        questionText: recallItem.questionText,
        questionType: recallItem.questionType,
        answerRubric: recallItem.answerRubric,
        chunkName: chunk.name,
        chunkContentMd: chunk.contentMd,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
          ne(chunkTracking.status, 'untracked')
        )
      )
      .orderBy(recallItem.due)
      .limit(limit)
      .$dynamic();

    if (options?.topicId) {
      query = query.where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
          ne(chunkTracking.status, 'untracked'),
          eq(topic.id, options.topicId)
        )
      );
    }

    if (options?.noteId) {
      query = query.where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
          ne(chunkTracking.status, 'untracked'),
          eq(note.id, options.noteId)
        )
      );
    }

    return query;
  }

  async getItemById(id: string) {
    const [row] = await dbClient
      .select({
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        userId: recallItem.userId,
        questionTitle: recallItem.questionTitle,
        questionText: recallItem.questionText,
        answerRubric: recallItem.answerRubric,
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
        chunkName: chunk.name,
        chunkContentMd: chunk.contentMd,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(eq(recallItem.id, id))
      .limit(1);
    return row ?? null;
  }

  async getTrackedStatus(userId: string) {
    const items = await dbClient
      .select({
        id: chunkTracking.id,
        chunkId: chunkTracking.chunkId,
        status: chunkTracking.status,
        errorMessage: chunkTracking.errorMessage,
        retryCount: chunkTracking.retryCount,
        lastAttemptAt: chunkTracking.lastAttemptAt,
        createdAt: chunkTracking.createdAt,
        chunkName: chunk.name,
      })
      .from(chunkTracking)
      .innerJoin(chunk, eq(chunkTracking.chunkId, chunk.id))
      .where(
        and(
          eq(chunkTracking.userId, userId),
          ne(chunkTracking.status, 'untracked')
        )
      );
    return items;
  }

  async retryChunk(
    chunkId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    }
  ) {
    // Fire-and-forget — SSE will notify when generation completes
    void this.callQuestionGenService(
      `/generate/retry/${chunkId}`,
      userId,
      aiConfig
    ).catch((err) => {
      this.logger.error(`Background retry failed for chunk ${chunkId}: ${err}`);
    });
    return { chunkId, status: 'pending' };
  }

  async retryAllFailed(
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    }
  ) {
    // Fire-and-forget — SSE will notify when generation completes
    void this.callQuestionGenService(
      '/generate/retry-failed',
      userId,
      aiConfig
    ).catch((err) => {
      this.logger.error(`Background retry-all-failed failed: ${err}`);
    });
    return { status: 'pending' };
  }

  async getUnderperformingChunks(
    userId: string,
    minLapses = 2,
    maxStability = 1.0
  ) {
    const rows = await dbClient
      .select({
        chunkId: recallItem.chunkId,
        chunkName: chunk.name,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
        itemCount: sql<number>`count(*)::int`,
        totalLapses: sql<number>`sum(${recallItem.lapses})::int`,
        avgStability: sql<number>`round(avg(${recallItem.stability})::numeric, 2)::float`,
      })
      .from(recallItem)
      .innerJoin(chunk, eq(recallItem.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          ne(chunkTracking.status, 'untracked'),
          sql`(${recallItem.lapses} >= ${minLapses} OR (${recallItem.stability} < ${maxStability} AND ${recallItem.reps} >= 1))`
        )
      )
      .groupBy(
        recallItem.chunkId,
        chunk.name,
        note.name,
        note.id,
        topic.name,
        topic.id
      )
      .orderBy(
        sql`sum(${recallItem.lapses}) desc`,
        sql`avg(${recallItem.stability}) asc`
      );
    return rows;
  }

  async getOutdatedChunks(userId: string) {
    // Find tracked chunks where either:
    // 1. All recall items are retired (all questions exhausted)
    // 2. Chunk content changed since questions were generated
    const trackedChunks = await dbClient
      .select({
        chunkId: chunkTracking.chunkId,
        chunkName: chunk.name,
        noteName: note.name,
        noteId: note.id,
        topicName: topic.name,
        topicId: topic.id,
        trackingStatus: chunkTracking.status,
        lastAttemptAt: chunkTracking.lastAttemptAt,
        contentUpdatedAt: chunk.contentUpdatedAt,
      })
      .from(chunkTracking)
      .innerJoin(chunk, eq(chunkTracking.chunkId, chunk.id))
      .innerJoin(note, eq(chunk.noteId, note.id))
      .innerJoin(topic, eq(note.topicId, topic.id))
      .where(
        and(
          eq(chunkTracking.userId, userId),
          ne(chunkTracking.status, 'untracked'),
          ne(chunkTracking.status, 'pending'),
          ne(chunkTracking.status, 'generating')
        )
      );

    const results: Array<{
      chunkId: string;
      chunkName: string;
      noteName: string;
      noteId: string;
      topicName: string;
      topicId: string;
      reason: 'retired' | 'content_changed';
      activeCount: number;
      retiredCount: number;
    }> = [];

    for (const tc of trackedChunks) {
      // Check content changed
      const [loggedInUser] = await dbClient
        .select({
          max_question_reviews: user.maxQuestionReviews,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (
        tc.contentUpdatedAt &&
        tc.lastAttemptAt &&
        tc.contentUpdatedAt > tc.lastAttemptAt
      ) {
        const [counts] = await dbClient
          .select({
            total: count(),
            retired: sql<number>`count(*) filter (where ${recallItem.reps} >= ${loggedInUser.max_question_reviews})::int`,
          })
          .from(recallItem)
          .where(
            and(
              eq(recallItem.chunkId, tc.chunkId),
              eq(recallItem.userId, userId)
            )
          );
        results.push({
          chunkId: tc.chunkId,
          chunkName: tc.chunkName,
          noteName: tc.noteName,
          noteId: tc.noteId,
          topicName: tc.topicName,
          topicId: tc.topicId,
          reason: 'content_changed',
          activeCount: (counts?.total ?? 0) - (counts?.retired ?? 0),
          retiredCount: counts?.retired ?? 0,
        });
        continue;
      }

      // Check all questions retired

      const [counts] = await dbClient
        .select({
          total: count(),
          retired: sql<number>`count(*) filter (where ${recallItem.reps} >= ${loggedInUser.max_question_reviews})::int`,
          name: chunk.name,
        })
        .from(recallItem)
        .innerJoin(chunk, eq(chunk.id, recallItem.chunkId))
        .groupBy(chunk.name)
        .where(
          and(eq(recallItem.chunkId, tc.chunkId), eq(recallItem.userId, userId))
        );

      const total = counts?.total ?? 0;
      const retired = counts?.retired ?? 0;
      if (total > 0 && retired === total) {
        results.push({
          chunkId: tc.chunkId,
          chunkName: tc.chunkName,
          noteName: tc.noteName,
          noteId: tc.noteId,
          topicName: tc.topicName,
          topicId: tc.topicId,
          reason: 'retired',
          activeCount: 0,
          retiredCount: retired,
        });
      }
    }

    return results;
  }

  /**
   * Build a natural-language performance summary from review history.
   * Must be called BEFORE deleting recall items (review_log cascades).
   */
  private async buildPerformanceSummary(
    chunkId: string,
    userId: string
  ): Promise<string | null> {
    const items = await dbClient
      .select()
      .from(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      );

    if (items.length === 0) return null;

    const itemIds = items.map((i) => i.id);
    const logs = await dbClient
      .select()
      .from(reviewLog)
      .where(inArray(reviewLog.recallItemId, itemIds))
      .orderBy(desc(reviewLog.reviewedAt));

    if (logs.length === 0) return null;

    // Rating distribution
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const log of logs) ratingCounts[log.rating]++;

    const totalReviews = logs.length;
    const goodEasyRatio =
      (ratingCounts[3] + ratingCounts[4]) / totalReviews;
    const totalLapses = items.reduce((sum, i) => sum + i.lapses, 0);

    // Knowledge level
    let knowledgeLevel: string;
    if (goodEasyRatio >= 0.8 && totalLapses <= 1) {
      knowledgeLevel = 'STRONG';
    } else if (goodEasyRatio >= 0.6) {
      knowledgeLevel = 'MODERATE';
    } else if (goodEasyRatio >= 0.35) {
      knowledgeLevel = 'DEVELOPING';
    } else {
      knowledgeLevel = 'WEAK';
    }

    // Per-question summaries
    const questionSummaries: string[] = [];
    for (const item of items) {
      const itemLogs = logs.filter((l) => l.recallItemId === item.id);
      if (itemLogs.length === 0) continue;

      const ratings = itemLogs.map((l) => RATING_LABELS[l.rating]).join(', ');

      // Extract strengths/weaknesses from analysisJson
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      for (const log of itemLogs) {
        const analysis = log.analysisJson as {
          strengths?: string[];
          weaknesses?: string[];
        } | null;
        if (analysis?.strengths) strengths.push(...analysis.strengths);
        if (analysis?.weaknesses) weaknesses.push(...analysis.weaknesses);
      }

      let summary = `- Q: "${item.questionTitle}" | Ratings: [${ratings}] | Reps: ${item.reps}, Lapses: ${item.lapses}, Stability: ${item.stability.toFixed(1)}d`;
      if (strengths.length > 0)
        summary += `\n  Strengths: ${[...new Set(strengths)].slice(0, 3).join('; ')}`;
      if (weaknesses.length > 0)
        summary += `\n  Weaknesses: ${[...new Set(weaknesses)].slice(0, 3).join('; ')}`;

      questionSummaries.push(summary);
    }

    return `## User Performance Summary
Overall knowledge level: ${knowledgeLevel}
Total reviews: ${totalReviews} | Rating distribution: Again=${ratingCounts[1]}, Hard=${ratingCounts[2]}, Good=${ratingCounts[3]}, Easy=${ratingCounts[4]}
Total lapses: ${totalLapses} | Good+Easy ratio: ${(goodEasyRatio * 100).toFixed(0)}%

### Per-Question Breakdown
${questionSummaries.join('\n')}`;
  }

  async regenerateChunk(
    chunkId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    }
  ) {
    // Build performance summary BEFORE deleting (review_log cascades on delete)
    const performanceSummary = await this.buildPerformanceSummary(
      chunkId,
      userId
    );

    // Retire ALL existing non-retired recall items for this chunk
    const now = new Date();
    const oldRecallItems = await dbClient
      .select()
      .from(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      );

    // archive old recall items
    await dbClient.insert(recallItemArchive).values(
      oldRecallItems.map((oldRecallItem) => ({
        ...oldRecallItem,
        retiredAt: now,
      }))
    );

    await dbClient
      .delete(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      );

    // Reset chunkTracking status to 'pending'
    await dbClient
      .update(chunkTracking)
      .set({ status: 'pending', errorMessage: null })
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      );

    // Fire-and-forget: trigger question generation in the background
    void this.triggerQuestionGen(
      chunkId,
      userId,
      aiConfig,
      undefined,
      undefined,
      performanceSummary
    ).catch((err) => {
      this.logger.error(
        `Background regeneration failed for chunk ${chunkId}: ${err}`
      );
    });

    this.logger.log(`Regeneration triggered for chunk ${chunkId}`);
    return {
      chunkId,
      status: 'pending',
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers for question-gen-service calls
  // ---------------------------------------------------------------------------

  /**
   * Call question-gen-service and await response.
   * Throws if the endpoint is not configured or the call fails.
   */
  private async callQuestionGenService(
    path: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    },
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const qgenEndpoint = process.env.QUESTION_GEN_SERVICE_API_ENDPOINT;
    if (!qgenEndpoint) {
      throw new Error('QUESTION_GEN_SERVICE_API_ENDPOINT not configured');
    }

    const res = await fetch(`${qgenEndpoint}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.QUESTION_GEN_SERVICE_API_KEY && {
          'x-api-key': process.env.QUESTION_GEN_SERVICE_API_KEY,
        }),
        'x-user-id': userId,
        ...(aiConfig?.provider && { 'x-ai-provider': aiConfig.provider }),
        ...(aiConfig?.model && { 'x-ai-model': aiConfig.model }),
        ...(aiConfig?.apiKey && { 'x-ai-api-key': aiConfig.apiKey }),
        'x-byok': aiConfig?.byok ? 'true' : 'false',
      },
      ...(body && Object.keys(body).length > 0 && { body: JSON.stringify(body) }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `Question generation service error ${res.status}: ${text}`
      );
    }

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  /**
   * Trigger question generation for a single chunk via question-gen-service.
   * Returns the parsed response (includes newBalance when passes were deducted).
   */
  private async triggerQuestionGen(
    chunkId: string,
    userId: string,
    aiConfig?: {
      provider?: string;
      model?: string;
      apiKey?: string;
      byok?: boolean;
    },
    questionTypes?: string[],
    questionCount?: number,
    performanceSummary?: string | null
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {};
    if (questionTypes?.length) body.questionTypes = questionTypes;
    if (questionCount != null) body.questionCount = questionCount;
    if (performanceSummary) body.performanceSummary = performanceSummary;

    return this.callQuestionGenService(
      `/generate/${chunkId}`,
      userId,
      aiConfig,
      body
    );
  }

  async getDueCount(userId: string) {
    const now = new Date();
    const [result] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(recallItem)
      .innerJoin(
        chunkTracking,
        and(
          eq(recallItem.chunkId, chunkTracking.chunkId),
          eq(recallItem.userId, chunkTracking.userId)
        )
      )
      .where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
          ne(chunkTracking.status, 'untracked')
        )
      );
    return result?.count ?? 0;
  }
}
