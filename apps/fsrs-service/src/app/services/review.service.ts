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
      .select()
      .from(recallItem)
      .where(eq(recallItem.id, recallItemId))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Recall item ${recallItemId} not found`);
    }

    const cardInput = {
      due: item.due,
      stability: item.stability,
      difficulty: item.difficulty,
      elapsed_days: item.elapsedDays,
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
          elapsedDays: nextCard.elapsed_days,
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

    return {
      recallItemId,
      rating,
      nextState: nextCard.state,
      nextDue: nextCard.due,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
    };
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
