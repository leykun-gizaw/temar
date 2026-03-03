import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const questionTypeEnum = z.enum(['mcq', 'open_ended', 'leetcode']);

const questionSchema = z.object({
  questions: z.array(
    z.object({
      title: z
        .string()
        .describe('Short descriptive title for the question (3-8 words)'),
      question: z.string().describe('A self-contained recall question'),
      questionType: questionTypeEnum.describe(
        'The type of question: mcq, open_ended, or leetcode'
      ),
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

export type QuestionType = z.infer<typeof questionTypeEnum>;

export type AiConfig = {
  provider?: string;
  model?: string;
  apiKey?: string;
};

const DEFAULT_MODELS: Record<string, string> = {
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
};

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private resolveModel(config?: AiConfig) {
    const provider = config?.provider || process.env.AI_PROVIDER || 'google';
    const modelId =
      config?.model ||
      process.env.AI_MODEL ||
      DEFAULT_MODELS[provider] ||
      'gemini-2.0-flash';

    switch (provider) {
      case 'openai': {
        const openai = createOpenAI(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        return openai(modelId);
      }
      case 'anthropic': {
        const anthropic = createAnthropic(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        return anthropic(modelId);
      }
      case 'google':
      default: {
        const google = createGoogleGenerativeAI(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        return google(modelId);
      }
    }
  }

  async generateQuestions(
    chunkContent: string,
    chunkName: string,
    noteName: string,
    topicName: string,
    aiConfig?: AiConfig,
    questionTypes?: QuestionType[],
    questionCount?: number
  ): Promise<GeneratedQuestion[]> {
    const llmModel = this.resolveModel(aiConfig);
    const types = questionTypes?.length ? questionTypes : ['open_ended'];
    const count =
      questionCount ??
      Math.min(Math.max(Math.ceil(chunkContent.length / 500), 2), 5);

    const typeDescriptions = types
      .map((t) => {
        switch (t) {
          case 'mcq':
            return 'Multiple-choice questions (MCQ) — provide the question with 4 answer options labeled A-D, with exactly one correct answer indicated in the keyPoints';
          case 'open_ended':
            return 'Open-ended explainer questions — require a written explanation demonstrating understanding';
          case 'leetcode':
            return 'Algorithm/coding-style questions (Leetcode-style) — present a problem that requires designing a solution approach, pseudocode, or code';
          default:
            return '';
        }
      })
      .join('\n  ');

    const systemPrompt = `You are a rigorous but encouraging Socratic tutor. Your goal is to craft questions that test deep understanding — not trivia or surface-level memorization.

## Your Process
1. **Read the entire content carefully.** Understand the core concepts, relationships, and nuances.
2. **Identify question-worthy sections.** Focus on conceptually dense, tricky, or foundational material. Skip boilerplate, trivial definitions, or purely decorative content.
3. **Generate exactly ${count} question(s)** of the following type(s):
  ${typeDescriptions}

## Question Attributes
- Each question MUST have a short descriptive title (3-8 words)
- Each question MUST specify its questionType: ${types
      .map((t) => `"${t}"`)
      .join(', ')}
- Questions must be self-contained (answerable without seeing the original content)
- Test understanding, application, or synthesis — not just recall of isolated facts
- The rubric criteria describe HOW to structure a good answer (e.g. "Address X aspect", "Compare Y with Z") — do NOT reveal the actual answer content in criteria
- Key points are internal grading notes hidden from the student — include specific facts, details, and expected reasoning there

## Constraints
- Do NOT generate more or fewer than ${count} question(s)
- Distribute question types as evenly as possible across the requested types
- If the content is too thin for ${count} meaningful questions, generate fewer but note this`;

    const userPrompt = `Topic: ${topicName}
Note: ${noteName}
Chunk: ${chunkName}

Content:
${chunkContent}`;

    try {
      const { output } = await generateText({
        model: llmModel as Parameters<typeof generateText>[0]['model'],
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
