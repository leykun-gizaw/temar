import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { z } from 'zod';

const questionTypeEnum = z.enum(['mcq', 'open_ended', 'leetcode']);

const openEndedRubricSchema = z.object({
  type: z.literal('open_ended'),
  sections: z
    .array(z.string())
    .describe(
      'Named sections the answer must contain for it to be considered sufficient (e.g. "Definition", "Comparison", "Real-world example")'
    ),
  criteria: z
    .array(z.string())
    .describe(
      'VISIBLE to student. Generic structural guidance ONLY (e.g. "Compare at least two approaches", "Include a concrete example", "Discuss trade-offs"). MUST NOT contain any factual content, specific answers, definitions, or hints that reveal what the correct answer is.'
    ),
  keyPoints: z
    .array(z.string())
    .describe(
      'HIDDEN from student. Specific facts, definitions, expected reasoning, and details the answer should contain. This is the ONLY place for answer-revealing content.'
    ),
});

const mcqRubricSchema = z.object({
  type: z.literal('mcq'),
  choices: z
    .array(
      z.object({
        label: z.string().describe('Choice label: A, B, C, or D'),
        text: z.string().describe('The choice text'),
      })
    )
    .describe('Exactly 4 answer options labeled A through D'),
  correctAnswer: z
    .string()
    .describe('The label of the correct answer (A, B, C, or D)'),
  explanation: z
    .string()
    .describe(
      'Explanation of why the correct answer is right and others are wrong (hidden from student until after answering)'
    ),
  keyPoints: z
    .array(z.string())
    .describe(
      'Internal grading notes with specific facts/details expected (hidden from student)'
    ),
});

const leetcodeRubricSchema = z.object({
  type: z.literal('leetcode'),
  functionPrototype: z
    .string()
    .describe(
      'Function signature the student must implement (e.g. "function twoSum(nums: number[], target: number): number[]")'
    ),
  examples: z
    .array(
      z.object({
        input: z
          .string()
          .describe('Example input (e.g. "nums = [2,7,11,15], target = 9")'),
        output: z.string().describe('Expected output (e.g. "[0,1]")'),
        explanation: z
          .string()
          .optional()
          .describe('Optional explanation of why this is the expected output'),
      })
    )
    .describe('2-3 input/output examples like LeetCode'),
  constraints: z
    .array(z.string())
    .describe(
      'Constraints on the input (e.g. "2 <= nums.length <= 10^4", "Each input has exactly one solution")'
    ),
  keyPoints: z
    .array(z.string())
    .describe(
      'Internal grading notes: expected approach, time/space complexity, edge cases (hidden from student)'
    ),
});

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
      rubric: z
        .discriminatedUnion('type', [
          openEndedRubricSchema,
          mcqRubricSchema,
          leetcodeRubricSchema,
        ])
        .describe(
          'Type-specific rubric — the structure depends on questionType'
        ),
    })
  ),
});

type GeneratedQuestion = z.infer<typeof questionSchema>['questions'][number];

// Per-type schemas — each locks the rubric to a single type so structured
// output physically cannot produce the wrong variant.
const typeSchemasMap = {
  open_ended: z.object({
    questions: z.array(
      z.object({
        title: z.string().describe('Short descriptive title for the question (3-8 words)'),
        question: z.string().describe('A self-contained recall question'),
        questionType: z.literal('open_ended'),
        rubric: openEndedRubricSchema,
      })
    ),
  }),
  mcq: z.object({
    questions: z.array(
      z.object({
        title: z.string().describe('Short descriptive title for the question (3-8 words)'),
        question: z.string().describe('A self-contained recall question'),
        questionType: z.literal('mcq'),
        rubric: mcqRubricSchema,
      })
    ),
  }),
  leetcode: z.object({
    questions: z.array(
      z.object({
        title: z.string().describe('Short descriptive title for the question (3-8 words)'),
        question: z.string().describe('A self-contained recall question'),
        questionType: z.literal('leetcode'),
        rubric: leetcodeRubricSchema,
      })
    ),
  }),
} as const;

export type QuestionType = z.infer<typeof questionTypeEnum>;

export type AiConfig = {
  provider?: string;
  model?: string;
  apiKey?: string;
  byok?: boolean;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

import { DEFAULT_MODEL_ID } from '@temar/shared-types';
import { queryProviderModelId } from '@temar/db-client';

/**
 * Fallback provider model IDs for BYOK users who supply their own API key
 * but no explicit model. These are raw provider identifiers (not pricing IDs).
 */
const BYOK_FALLBACK_MODELS: Record<string, string> = {
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  deepseek: 'deepseek-chat',
};

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private async resolveModel(config?: AiConfig): Promise<{
    model: ReturnType<ReturnType<typeof createGoogleGenerativeAI>>;
    pricingModelId: string;
  }> {
    const provider = config?.provider || process.env.AI_PROVIDER || 'google';

    // Determine the pricing model ID (what we bill against)
    const pricingModelId =
      config?.model ||
      process.env.AI_MODEL ||
      DEFAULT_MODEL_ID;

    // Map pricing ID → provider model ID for the actual LLM call (DB lookup)
    const providerModelId = await queryProviderModelId(pricingModelId);

    switch (provider) {
      case 'openai': {
        const openai = createOpenAI(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        const sdkModelId = config?.apiKey
          ? (providerModelId || BYOK_FALLBACK_MODELS.openai)
          : providerModelId;
        return { model: openai(sdkModelId) as any, pricingModelId };
      }
      case 'anthropic': {
        const anthropic = createAnthropic(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        const sdkModelId = config?.apiKey
          ? (providerModelId || BYOK_FALLBACK_MODELS.anthropic)
          : providerModelId;
        return { model: anthropic(sdkModelId) as any, pricingModelId };
      }
      case 'deepseek': {
        const deepseek = createDeepSeek({
          apiKey: config?.apiKey || process.env.DEEPSEEK_API_KEY,
        });
        const sdkModelId = config?.apiKey
          ? (providerModelId || BYOK_FALLBACK_MODELS.deepseek)
          : providerModelId;
        return { model: deepseek(sdkModelId) as any, pricingModelId };
      }
      case 'google':
      default: {
        const google = createGoogleGenerativeAI(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        const sdkModelId = config?.apiKey
          ? (providerModelId || BYOK_FALLBACK_MODELS.google)
          : providerModelId;
        return { model: google(sdkModelId), pricingModelId };
      }
    }
  }

  private getTypeDescription(t: QuestionType): string {
    switch (t) {
      case 'mcq':
        return `**Multiple-choice questions (MCQ)**
  - The question text asks a clear question
  - rubric.type MUST be "mcq"
  - rubric.choices: exactly 4 options labeled A, B, C, D — each with a "label" and "text" field
  - rubric.correctAnswer: the label of the correct choice (e.g. "B")
  - rubric.explanation: explain why the correct answer is right and why the distractors are wrong (hidden until after answering)
  - rubric.keyPoints: internal grading notes`;
      case 'open_ended':
        return `**Open-ended explainer questions**
  - The question text asks the student to explain, compare, analyze, or discuss
  - rubric.type MUST be "open_ended"
  - rubric.sections: list the named sections the answer MUST contain (e.g. ["Definition", "Key Properties", "Example", "Comparison"]) — this tells the student what structure is expected
  - rubric.criteria: VISIBLE to student — generic structural/format guidance ONLY (e.g. "Compare at least two approaches", "Include a concrete example", "Discuss trade-offs"). NEVER put factual content, specific definitions, or anything that reveals the answer here.
  - rubric.keyPoints: HIDDEN from student — put ALL specific facts, definitions, expected reasoning, and answer details here. This is the ONLY place for answer-revealing content.`;
      case 'leetcode':
        return `**Algorithm/Leetcode-style questions**
  - The question text describes a problem requiring an algorithmic solution
  - rubric.type MUST be "leetcode"
  - rubric.functionPrototype: the function signature the student must implement (e.g. "function twoSum(nums: number[], target: number): number[]")
  - rubric.examples: 2-3 input/output examples, each with "input", "output", and optional "explanation" — format like LeetCode (e.g. input: "nums = [2,7,11,15], target = 9", output: "[0,1]")
  - rubric.constraints: constraints on the input (e.g. "2 <= nums.length <= 10^4")
  - rubric.keyPoints: internal grading notes — expected approach, optimal time/space complexity, edge cases (hidden from student)`;
      default:
        return '';
    }
  }

  private buildSystemPrompt(type: QuestionType, count: number): string {
    return `You are a rigorous but encouraging Socratic tutor. Your goal is to craft questions that test deep understanding — not trivia or surface-level memorization.

## Your Process
1. **Read the entire content carefully.** Understand the core concepts, relationships, and nuances.
2. **Identify question-worthy sections.** Focus on conceptually dense, tricky, or foundational material. Skip boilerplate, trivial definitions, or purely decorative content.
3. **Generate exactly ${count} ${type} question(s).**

  ${this.getTypeDescription(type)}

## CRITICAL: Rubric Structure Rules
- The rubric object MUST have a "type" field matching the questionType
- For "open_ended" questions: rubric must have { type: "open_ended", sections: [...], criteria: [...], keyPoints: [...] }
- For "mcq" questions: rubric must have { type: "mcq", choices: [{label, text}, ...], correctAnswer: "A"|"B"|"C"|"D", explanation: "...", keyPoints: [...] }
- For "leetcode" questions: rubric must have { type: "leetcode", functionPrototype: "...", examples: [{input, output, explanation?}, ...], constraints: [...], keyPoints: [...] }

## Question Attributes
- Each question MUST have a short descriptive title (3-8 words)
- Each question MUST have questionType: "${type}"
- Questions must be self-contained (answerable without seeing the original content)
- Test understanding, application, or synthesis — not just recall of isolated facts

## CRITICAL: Do NOT Give Away Answers
- rubric.sections and rubric.criteria are SHOWN to the student BEFORE they answer
- They must NEVER contain specific facts, definitions, explanations, or anything that hints at the correct answer
- BAD criteria: "Explain that the compiler notes the variable's name and type" (this IS the answer)
- GOOD criteria: "Describe the role of each stage in the process", "Include a concrete example"
- ALL specific factual content, expected details, and answer-revealing information goes ONLY in rubric.keyPoints (which is hidden from the student)

## Constraints
- Do NOT generate more or fewer than ${count} question(s)
- Every question MUST be of type "${type}"
- If the content is too thin for ${count} meaningful questions, generate fewer but note this`;
  }

  async generateQuestions(
    chunkContent: string,
    chunkName: string,
    noteName: string,
    topicName: string,
    aiConfig?: AiConfig,
    questionTypes?: QuestionType[],
    questionCount?: number,
    performanceSummary?: string
  ): Promise<{
    questions: GeneratedQuestion[];
    usage: TokenUsage;
    modelId: string;
  }> {
    const { model: llmModel, pricingModelId: modelId } = await this.resolveModel(aiConfig);
    const types = questionTypes?.length ? questionTypes : (['open_ended'] as QuestionType[]);
    const count =
      questionCount ??
      Math.min(Math.max(Math.ceil(chunkContent.length / 500), 2), 5);

    // Round-robin distribution: spread count evenly across types
    const typeDistribution = new Map<QuestionType, number>();
    for (const t of types) typeDistribution.set(t, 0);
    for (let i = 0; i < count; i++) {
      const t = types[i % types.length];
      typeDistribution.set(t, typeDistribution.get(t)! + 1);
    }

    let userPrompt = `Topic: ${topicName}
Note: ${noteName}
Chunk: ${chunkName}

Content:
${chunkContent}`;

    if (performanceSummary) {
      userPrompt += `\n\n---\n${performanceSummary}`;
    }

    // Fire one LLM call per type in parallel — each call's schema is locked
    // to a single question type so the output is guaranteed correct.
    const calls = Array.from(typeDistribution.entries())
      .filter(([, n]) => n > 0)
      .map(async ([type, typeCount]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const schema = typeSchemasMap[type] as any;
        let systemPrompt = this.buildSystemPrompt(type, typeCount);

        if (performanceSummary) {
          systemPrompt += `\n\n## Previous Performance Context
The user is regenerating questions for this chunk after completing a previous review cycle.
Use the following performance summary to adapt your questions:

### How to use this context:
- If the user showed WEAK understanding: generate foundational questions that reinforce core concepts
- If the user showed MODERATE understanding: generate questions that probe deeper connections and applications
- If the user showed STRONG understanding: generate advanced questions testing synthesis, edge cases, and cross-concept reasoning
- Target the identified GAPS specifically — create questions that address the weaknesses found in previous reviews
- Avoid generating questions identical to ones the user already mastered (high stability, no lapses)
- Vary question types and angles from the previous round to test understanding from different perspectives`;
        }

        const result = await generateText({
          model: llmModel as Parameters<typeof generateText>[0]['model'],
          maxRetries: 0,
          output: Output.object({ schema }),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.5,
        });
        const output = result.output as { questions: GeneratedQuestion[] };

        return {
          questions: output.questions,
          usage: {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
          },
        };
      });

    try {
      const results = await Promise.all(calls);

      const allQuestions = results.flatMap((r) => r.questions);
      const totalUsage: TokenUsage = results.reduce(
        (acc, r) => ({
          inputTokens: acc.inputTokens + r.usage.inputTokens,
          outputTokens: acc.outputTokens + r.usage.outputTokens,
        }),
        { inputTokens: 0, outputTokens: 0 }
      );

      if (allQuestions.length === 0) {
        this.logger.error('LLM returned no questions');
        return { questions: [], usage: totalUsage, modelId };
      }

      this.logger.log(
        `Generated ${allQuestions.length} questions for chunk "${chunkName}" (${Array.from(typeDistribution.entries()).map(([t, n]) => `${n}×${t}`).join(', ')})`
      );
      return { questions: allQuestions, usage: totalUsage, modelId };
    } catch (err) {
      this.logger.error(`LLM generation failed: ${err}`);
      throw err;
    }
  }
}
