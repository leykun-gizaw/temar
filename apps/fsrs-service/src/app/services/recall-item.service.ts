import { Injectable, Logger } from '@nestjs/common';
import {
  dbClient,
  recallItem,
  chunk,
  note,
  topic,
  chunkTracking,
} from '@temar/db-client';
import { eq, and, lte, sql } from 'drizzle-orm';
import { FsrsEngineService } from './fsrs-engine.service';

@Injectable()
export class RecallItemService {
  private readonly logger = new Logger(RecallItemService.name);

  constructor(private readonly fsrsEngine: FsrsEngineService) {}

  async trackChunk(chunkId: string, userId: string) {
    try {
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

  async trackNote(noteId: string, userId: string) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(and(eq(chunk.noteId, noteId), eq(chunk.userId, userId)));

    const results = [];
    for (const c of chunks) {
      results.push(await this.trackChunk(c.id, userId));
    }

    this.logger.log(
      `Tracked note ${noteId}: ${results.filter((r) => r.tracked).length}/${
        chunks.length
      } chunks`
    );
    return { noteId, results };
  }

  async trackTopic(topicId: string, userId: string) {
    const notes = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(and(eq(note.topicId, topicId), eq(note.userId, userId)));

    const results = [];
    for (const n of notes) {
      results.push(await this.trackNote(n.id, userId));
    }

    this.logger.log(`Tracked topic ${topicId}: ${notes.length} notes`);
    return { topicId, results };
  }

  async untrackChunk(chunkId: string, userId: string) {
    // Delete associated recall items first
    await dbClient
      .delete(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      );

    // Delete chunk_tracking row
    const deleted = await dbClient
      .delete(chunkTracking)
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      )
      .returning({ id: chunkTracking.id });
    return { untracked: deleted.length > 0, chunkId };
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
        elapsedDays: recallItem.elapsedDays,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
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
      .where(eq(recallItem.userId, userId))
      .orderBy(recallItem.due)
      .limit(limit)
      .offset(offset);

    const [countResult] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(recallItem)
      .where(eq(recallItem.userId, userId));

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
        elapsedDays: recallItem.elapsedDays,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
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
      .where(eq(recallItem.userId, userId))
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
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        elapsedDays: recallItem.elapsedDays,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
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
      .where(and(eq(recallItem.userId, userId), lte(recallItem.due, now)))
      .orderBy(recallItem.due)
      .limit(limit)
      .$dynamic();

    if (options?.topicId) {
      query = query.where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
          eq(topic.id, options.topicId)
        )
      );
    }

    if (options?.noteId) {
      query = query.where(
        and(
          eq(recallItem.userId, userId),
          lte(recallItem.due, now),
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
        questionText: recallItem.questionText,
        answerRubric: recallItem.answerRubric,
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        elapsedDays: recallItem.elapsedDays,
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
        createdAt: chunkTracking.createdAt,
      })
      .from(chunkTracking)
      .where(eq(chunkTracking.userId, userId));
    return items;
  }

  async getDueCount(userId: string) {
    const now = new Date();
    const [result] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(recallItem)
      .where(and(eq(recallItem.userId, userId), lte(recallItem.due, now)));
    return result?.count ?? 0;
  }
}
