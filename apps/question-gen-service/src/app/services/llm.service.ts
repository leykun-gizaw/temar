import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const questionSchema = z.object({
  questions: z.array(
    z.object({
      title: z
        .string()
        .describe('Short descriptive title for the question (3-8 words)'),
      question: z.string().describe('A self-contained recall question'),
      rubric: z.object({
        criteria: z
          .array(z.string())
          .describe(
            'Structural guidance for how to organize and approach the answer'
          ),
        keyPoints: z
          .array(z.string())
          .describe(
            'Internal grading notes with specific facts/details expected (hidden from student)'
          ),
      }),
    })
  ),
});

type GeneratedQuestion = z.infer<typeof questionSchema>['questions'][number];

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  async generateQuestions(
    chunkContent: string,
    chunkName: string,
    noteName: string,
    topicName: string
  ): Promise<GeneratedQuestion[]> {
    const model = process.env.AI_MODEL || 'gemini-2.0-flash';

    const systemPrompt = `You are an expert educator creating recall questions from study material.
Given a chunk of content, generate 2-5 recall questions with answer rubrics.

Rules:
- Each question must have a short descriptive title (3-8 words)
- Questions should test understanding, not just memorization
- Include a mix of: factual recall, conceptual understanding, and application questions
- The rubric criteria should describe HOW to structure a good answer (e.g. "Address X aspect", "Compare Y with Z"), NOT reveal the actual answer content
- Criteria should guide answer organization and completeness, not give away key facts
- Key points are internal grading notes — they WILL be hidden from the student, so include specific facts/details expected in the answer there
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
        maxRetries: 0,
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
