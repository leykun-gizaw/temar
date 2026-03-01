import { Injectable, Logger } from '@nestjs/common';
import {
  dbClient,
  recallItem,
  chunk,
  note,
  topic,
  chunkTracking,
  user,
  recallItemArchive,
} from '@temar/db-client';
import { eq, ne, and, lte, sql, count } from 'drizzle-orm';

@Injectable()
export class RecallItemService {
  private readonly logger = new Logger(RecallItemService.name);

  async trackChunk(
    chunkId: string,
    userId: string,
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
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

      // Fire-and-forget: trigger question generation in question-gen-service
      const qgenEndpoint = process.env.QUESTION_GEN_SERVICE_API_ENDPOINT;
      if (qgenEndpoint) {
        fetch(`${qgenEndpoint}/generate/${chunkId}`, {
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
          },
        }).catch((err) =>
          this.logger.error(
            `Fire-and-forget question generation failed for chunk ${chunkId}: ${err}`
          )
        );
      }

      return { tracked: true, chunkId, trackingId: row.id, status: 'pending' };
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
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
  ) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(and(eq(chunk.noteId, noteId), eq(chunk.userId, userId)));

    const results = [];
    for (const c of chunks) {
      results.push(await this.trackChunk(c.id, userId, aiConfig));
    }

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
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
  ) {
    const notes = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(and(eq(note.topicId, topicId), eq(note.userId, userId)));

    const results = [];
    for (const n of notes) {
      results.push(await this.trackNote(n.id, userId, aiConfig));
    }

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
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
  ) {
    const qgenEndpoint = process.env.QUESTION_GEN_SERVICE_API_ENDPOINT;
    if (!qgenEndpoint) {
      throw new Error('QUESTION_GEN_SERVICE_API_ENDPOINT not configured');
    }
    // Fire-and-forget: trigger retry in question-gen-service
    fetch(`${qgenEndpoint}/generate/retry/${chunkId}`, {
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
      },
    }).catch((err) =>
      this.logger.error(
        `Fire-and-forget retry failed for chunk ${chunkId}: ${err}`
      )
    );
    return { chunkId, status: 'retry_triggered' };
  }

  async retryAllFailed(
    userId: string,
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
  ) {
    const qgenEndpoint = process.env.QUESTION_GEN_SERVICE_API_ENDPOINT;
    if (!qgenEndpoint) {
      throw new Error('QUESTION_GEN_SERVICE_API_ENDPOINT not configured');
    }
    fetch(`${qgenEndpoint}/generate/retry-failed`, {
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
      },
    }).catch((err) =>
      this.logger.error(`Fire-and-forget retry-all-failed failed: ${err}`)
    );
    return { status: 'retry_all_triggered' };
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

  async regenerateChunk(
    chunkId: string,
    userId: string,
    aiConfig?: { provider?: string; model?: string; apiKey?: string }
  ) {
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

    // Fire-and-forget: trigger question generation
    const qgenEndpoint = process.env.QUESTION_GEN_SERVICE_API_ENDPOINT;
    if (qgenEndpoint) {
      fetch(`${qgenEndpoint}/generate/${chunkId}`, {
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
        },
      }).catch((err) =>
        this.logger.error(
          `Fire-and-forget regeneration failed for chunk ${chunkId}: ${err}`
        )
      );
    }

    this.logger.log(`Regeneration triggered for chunk ${chunkId}`);
    return { chunkId, status: 'regeneration_triggered' };
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
