import { Injectable, Logger } from '@nestjs/common';
import { dbClient, recallItem, chunk, note, topic } from '@temar/db-client';
import { eq, and, lte, sql } from 'drizzle-orm';
import { FsrsEngineService } from './fsrs-engine.service';

@Injectable()
export class RecallItemService {
  private readonly logger = new Logger(RecallItemService.name);

  constructor(private readonly fsrsEngine: FsrsEngineService) {}

  async trackChunk(chunkId: string, userId: string) {
    const card = this.fsrsEngine.createCard();

    try {
      await dbClient
        .insert(recallItem)
        .values({
          chunkId,
          userId,
          state: card.state,
          due: card.due,
          stability: card.stability,
          difficulty: card.difficulty,
          elapsedDays: card.elapsed_days,
          scheduledDays: card.scheduled_days,
          reps: card.reps,
          lapses: card.lapses,
          learningSteps: card.learning_steps,
          lastReview: card.last_review ?? null,
        })
        .onConflictDoNothing();
      this.logger.log(`Tracked chunk ${chunkId} for user ${userId}`);
      return { tracked: true, chunkId };
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes('recall_item_chunk_user_idx')
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
    const deleted = await dbClient
      .delete(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      )
      .returning({ id: recallItem.id });
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
        chunkName: chunk.name,
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
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        state: recallItem.state,
        due: recallItem.due,
        reps: recallItem.reps,
      })
      .from(recallItem)
      .where(eq(recallItem.userId, userId));
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
