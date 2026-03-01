import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { dbClient, recallItem, reviewLog } from '@temar/db-client';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { FsrsEngineService } from './fsrs-engine.service';
import type { Grade } from 'ts-fsrs';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly fsrsEngine: FsrsEngineService) {}

  async submitReview(
    recallItemId: string,
    rating: Grade,
    durationMs?: number,
    answerJson?: unknown
  ) {
    const [item] = await dbClient
      .select({
        id: recallItem.id,
        chunkId: recallItem.chunkId,
        userId: recallItem.userId,
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        scheduledDays: recallItem.scheduledDays,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        learningSteps: recallItem.learningSteps,
        lastReview: recallItem.lastReview,
      })
      .from(recallItem)
      .where(eq(recallItem.id, recallItemId))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Recall item ${recallItemId} not found`);
    }

    const elapsed_days = item.lastReview
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(item.lastReview).getTime()) / 86_400_000
          )
        )
      : 0;

    const cardInput = {
      due: item.due,
      stability: item.stability,
      difficulty: item.difficulty,
      elapsed_days,
      scheduled_days: item.scheduledDays,
      reps: item.reps,
      lapses: item.lapses,
      learning_steps: item.learningSteps,
      state: item.state,
      last_review: item.lastReview ?? undefined,
    };

    const result = this.fsrsEngine.applyRating(cardInput, rating);
    const nextCard = result.card;
    const log = result.log;

    await dbClient.transaction(async (tx) => {
      await tx
        .update(recallItem)
        .set({
          state: nextCard.state,
          due: nextCard.due,
          stability: nextCard.stability,
          difficulty: nextCard.difficulty,
          scheduledDays: nextCard.scheduled_days,
          reps: nextCard.reps,
          lapses: nextCard.lapses,
          learningSteps: nextCard.learning_steps,
          lastReview: nextCard.last_review ?? null,
        })
        .where(eq(recallItem.id, recallItemId));

      await tx.insert(reviewLog).values({
        recallItemId: recallItemId,
        userId: item.userId,
        rating: log.rating,
        state: log.state,
        due: log.due,
        stability: log.stability,
        difficulty: log.difficulty,
        elapsedDays: log.elapsed_days,
        scheduledDays: log.scheduled_days,
        durationMs: durationMs ?? null,
        answerJson: answerJson ?? null,
      });
    });

    this.logger.log(
      `Review submitted for ${recallItemId}: rating=${rating}, next due=${nextCard.due}`
    );
  }

  async getReviewHistory(recallItemId: string) {
    return dbClient
      .select()
      .from(reviewLog)
      .where(eq(reviewLog.recallItemId, recallItemId))
      .orderBy(desc(reviewLog.reviewedAt));
  }

  async getReviewLogsByDateRange(userId: string, from: Date, to: Date) {
    return dbClient
      .select()
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, from),
          lte(reviewLog.reviewedAt, to)
        )
      )
      .orderBy(desc(reviewLog.reviewedAt));
  }
}
