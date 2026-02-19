import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { questionSchema, GeneratedQuestion } from '@temar/shared-types';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  async generateQuestions(
    chunkContent: string,
    chunkName: string,
    noteName: string,
    topicName: string
  ): Promise<GeneratedQuestion[]> {
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    const systemPrompt = `You are an expert educator creating recall questions from study material.
Given a chunk of content, generate 2-5 recall questions with answer rubrics.

Rules:
- Questions should test understanding, not just memorization
- Include a mix of: factual recall, conceptual understanding, and application questions
- Each rubric should have clear criteria for evaluation and key points the answer must cover
- Questions should be self-contained (answerable without seeing the original content)
- Scale question count with content complexity: short/simple content = 2, long/complex = up to 5`;

    const userPrompt = `Topic: ${topicName}
Note: ${noteName}
Chunk: ${chunkName}

Content:
${chunkContent}`;

    try {
      const { output } = await generateText({
        model: google(model),
        output: Output.object({
          schema: questionSchema,
        }),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.5,
      });

      if (output.questions.length === 0) {
        this.logger.error('LLM returned no questions');
        return [];
      }

      this.logger.log(
        `Generated ${output.questions.length} questions for chunk "${chunkName}"`
      );
      return output.questions;
    } catch (err) {
      this.logger.error(`LLM generation failed: ${err}`);
      throw err;
    }
  }
}
