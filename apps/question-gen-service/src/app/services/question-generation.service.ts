import { Injectable, Logger } from '@nestjs/common';
import {
  dbClient,
  recallItem,
  chunk,
  note,
  topic,
  chunkTracking,
} from '@temar/db-client';
import { eq, and } from 'drizzle-orm';
import { LlmService } from './llm.service';
import { createEmptyCard } from 'ts-fsrs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(private readonly llmService: LlmService) {}

  async generateForChunk(chunkId: string, userId: string) {
    // Update tracking status to 'generating'
    await dbClient
      .update(chunkTracking)
      .set({ status: 'generating' })
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
          .set({ status: 'failed' })
          .where(
            and(
              eq(chunkTracking.chunkId, chunkId),
              eq(chunkTracking.userId, userId)
            )
          );
        return { chunkId, questions: [], error: 'No content available' };
      }

      // Generate questions via LLM
      const questions = await this.llmService.generateQuestions(
        content,
        chunkRow.name,
        chunkRow.noteName,
        chunkRow.topicName
      );

      if (questions.length === 0) {
        await dbClient
          .update(chunkTracking)
          .set({ status: 'failed' })
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

      // Update tracking status to 'ready'
      await dbClient
        .update(chunkTracking)
        .set({ status: 'ready' })
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
      this.logger.error(`Generation failed for chunk ${chunkId}: ${err}`);
      await dbClient
        .update(chunkTracking)
        .set({ status: 'failed' })
        .where(
          and(
            eq(chunkTracking.chunkId, chunkId),
            eq(chunkTracking.userId, userId)
          )
        );
      throw err;
    }
  }

  async generateBatch(chunkIds: string[], userId: string) {
    const results = [];
    for (const chunkId of chunkIds) {
      try {
        const result = await this.generateForChunk(chunkId, userId);
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
