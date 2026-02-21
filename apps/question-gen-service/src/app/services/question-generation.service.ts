import { Injectable, Logger } from '@nestjs/common';
import {
  dbClient,
  recallItem,
  chunk,
  note,
  topic,
  chunkTracking,
} from '@temar/db-client';
import { eq, and, sql } from 'drizzle-orm';
import { LlmService, AiConfig } from './llm.service';
import { createEmptyCard } from 'ts-fsrs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(private readonly llmService: LlmService) {}

  async generateForChunk(chunkId: string, userId: string, aiConfig?: AiConfig) {
    // Update tracking status to 'generating'
    await dbClient
      .update(chunkTracking)
      .set({
        status: 'generating',
        lastAttemptAt: new Date(),
      })
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      );

    try {
      // Fetch chunk with context
      const [chunkRow] = await dbClient
        .select({
          id: chunk.id,
          name: chunk.name,
          contentMd: chunk.contentMd,
          contentJson: chunk.contentJson,
          description: chunk.description,
          noteId: chunk.noteId,
          noteName: note.name,
          topicName: topic.name,
        })
        .from(chunk)
        .innerJoin(note, eq(chunk.noteId, note.id))
        .innerJoin(topic, eq(note.topicId, topic.id))
        .where(eq(chunk.id, chunkId))
        .limit(1);

      if (!chunkRow) {
        throw new Error(`Chunk ${chunkId} not found`);
      }

      const content =
        chunkRow.contentMd ||
        chunkRow.description ||
        (chunkRow.contentJson ? JSON.stringify(chunkRow.contentJson) : '');

      if (!content.trim()) {
        this.logger.warn(
          `Chunk ${chunkId} has no content to generate questions from`
        );
        await dbClient
          .update(chunkTracking)
          .set({
            status: 'failed',
            errorMessage: 'No content available',
            retryCount: sql`${chunkTracking.retryCount} + 1`,
            lastAttemptAt: new Date(),
          })
          .where(
            and(
              eq(chunkTracking.chunkId, chunkId),
              eq(chunkTracking.userId, userId)
            )
          );
        return { chunkId, questions: [], error: 'No content available' };
      }

      // Generate questions via LLM with exponential backoff + jitter
      const MAX_RETRIES = 5;
      const BASE_DELAY_MS = 5_000;
      let questions: Awaited<
        ReturnType<typeof this.llmService.generateQuestions>
      > = [];

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          questions = await this.llmService.generateQuestions(
            content,
            chunkRow.name,
            chunkRow.noteName,
            chunkRow.topicName,
            aiConfig
          );
          break;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const isRetryable =
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('quota') ||
            errMsg.includes('rate limit') ||
            errMsg.includes('500') ||
            errMsg.includes('502') ||
            errMsg.includes('503') ||
            errMsg.includes('ECONNREFUSED') ||
            errMsg.includes('ETIMEDOUT') ||
            errMsg.includes('fetch failed');

          if (isRetryable && attempt < MAX_RETRIES) {
            const jitter = Math.random() * 1000;
            const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
            this.logger.warn(
              `Retryable error on attempt ${attempt}/${MAX_RETRIES} for chunk ${chunkId}. Retrying in ${
                Math.round(delayMs / 100) / 10
              }s...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            throw err;
          }
        }
      }

      if (questions.length === 0) {
        await dbClient
          .update(chunkTracking)
          .set({
            status: 'failed',
            errorMessage: 'LLM returned no questions',
            retryCount: sql`${chunkTracking.retryCount} + 1`,
            lastAttemptAt: new Date(),
          })
          .where(
            and(
              eq(chunkTracking.chunkId, chunkId),
              eq(chunkTracking.userId, userId)
            )
          );
        return { chunkId, questions: [], error: 'No questions generated' };
      }

      // Create recall items for each question
      const batchId = uuidv4();
      const card = createEmptyCard();

      const recallItemValues = questions.map((q) => ({
        chunkId,
        userId,
        questionTitle: q.title,
        questionText: q.question,
        answerRubric: q.rubric,
        generationBatchId: batchId,
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
      }));

      const inserted = await dbClient
        .insert(recallItem)
        .values(recallItemValues)
        .returning({ id: recallItem.id })
        .onConflictDoNothing();

      // Update tracking status to 'ready' and clear error fields
      await dbClient
        .update(chunkTracking)
        .set({
          status: 'ready',
          errorMessage: null,
          lastAttemptAt: new Date(),
        })
        .where(
          and(
            eq(chunkTracking.chunkId, chunkId),
            eq(chunkTracking.userId, userId)
          )
        );

      this.logger.log(
        `Generated ${questions.length} questions for chunk ${chunkId} (batch ${batchId})`
      );

      return {
        chunkId,
        batchId,
        questionsGenerated: questions.length,
        recallItemIds: inserted.map((r) => r.id),
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Generation failed for chunk ${chunkId}: ${errMsg}`);
      await dbClient
        .update(chunkTracking)
        .set({
          status: 'failed',
          errorMessage: errMsg.slice(0, 500),
          retryCount: sql`${chunkTracking.retryCount} + 1`,
          lastAttemptAt: new Date(),
        })
        .where(
          and(
            eq(chunkTracking.chunkId, chunkId),
            eq(chunkTracking.userId, userId)
          )
        );
      throw err;
    }
  }

  async retryChunk(chunkId: string, userId: string, aiConfig?: AiConfig) {
    // Reset status to pending and re-run generation
    await dbClient
      .update(chunkTracking)
      .set({ status: 'pending', errorMessage: null })
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      );
    return this.generateForChunk(chunkId, userId, aiConfig);
  }

  async retryAllFailed(userId: string, aiConfig?: AiConfig) {
    const failedItems = await dbClient
      .select({
        chunkId: chunkTracking.chunkId,
      })
      .from(chunkTracking)
      .where(
        and(
          eq(chunkTracking.userId, userId),
          eq(chunkTracking.status, 'failed')
        )
      );

    const results = [];
    for (const item of failedItems) {
      try {
        const result = await this.retryChunk(item.chunkId, userId, aiConfig);
        results.push(result);
      } catch (err) {
        this.logger.error(`Retry failed for chunk ${item.chunkId}: ${err}`);
        results.push({ chunkId: item.chunkId, error: String(err) });
      }
      // Small delay between retries to avoid hammering the LLM
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return { results, total: failedItems.length };
  }

  async generateBatch(chunkIds: string[], userId: string, aiConfig?: AiConfig) {
    const results = [];
    for (const chunkId of chunkIds) {
      try {
        const result = await this.generateForChunk(chunkId, userId, aiConfig);
        results.push(result);
      } catch (err) {
        this.logger.error(
          `Batch generation failed for chunk ${chunkId}: ${err}`
        );
        results.push({ chunkId, error: String(err) });
      }
    }
    return { results, total: chunkIds.length };
  }

  async getStatus(chunkId: string, userId: string) {
    const [tracking] = await dbClient
      .select({
        id: chunkTracking.id,
        status: chunkTracking.status,
        createdAt: chunkTracking.createdAt,
      })
      .from(chunkTracking)
      .where(
        and(
          eq(chunkTracking.chunkId, chunkId),
          eq(chunkTracking.userId, userId)
        )
      )
      .limit(1);

    if (!tracking) {
      return { chunkId, tracked: false };
    }

    // Count generated recall items for this chunk
    const items = await dbClient
      .select({ id: recallItem.id })
      .from(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, userId))
      );

    return {
      chunkId,
      tracked: true,
      status: tracking.status,
      questionCount: items.length,
      createdAt: tracking.createdAt,
    };
  }
}
