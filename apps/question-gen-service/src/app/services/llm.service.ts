import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
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
        .union([openEndedRubricSchema, mcqRubricSchema, leetcodeRubricSchema])
        .describe(
          'Type-specific rubric — the structure depends on questionType'
        ),
    })
  ),
});

type GeneratedQuestion = z.infer<typeof questionSchema>['questions'][number];

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

const DEFAULT_MODELS: Record<string, string> = {
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
};

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private resolveModel(config?: AiConfig): {
    model: ReturnType<ReturnType<typeof createGoogleGenerativeAI>>;
    modelId: string;
  } {
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
        return { model: openai(modelId) as any, modelId };
      }
      case 'anthropic': {
        const anthropic = createAnthropic(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        return { model: anthropic(modelId) as any, modelId };
      }
      case 'google':
      default: {
        const google = createGoogleGenerativeAI(
          config?.apiKey ? { apiKey: config.apiKey } : {}
        );
        return { model: google(modelId), modelId };
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
  ): Promise<{
    questions: GeneratedQuestion[];
    usage: TokenUsage;
    modelId: string;
  }> {
    const { model: llmModel, modelId } = this.resolveModel(aiConfig);
    const types = questionTypes?.length ? questionTypes : ['open_ended'];
    const count =
      questionCount ??
      Math.min(Math.max(Math.ceil(chunkContent.length / 500), 2), 5);

    const typeDescriptions = types
      .map((t) => {
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
      })
      .join('\n\n  ');

    const systemPrompt = `You are a rigorous but encouraging Socratic tutor. Your goal is to craft questions that test deep understanding — not trivia or surface-level memorization.

## Your Process
1. **Read the entire content carefully.** Understand the core concepts, relationships, and nuances.
2. **Identify question-worthy sections.** Focus on conceptually dense, tricky, or foundational material. Skip boilerplate, trivial definitions, or purely decorative content.
3. **Generate exactly ${count} question(s)** of the following type(s):

  ${typeDescriptions}

## CRITICAL: Rubric Structure Rules
- The rubric object MUST have a "type" field matching the questionType
- For "open_ended" questions: rubric must have { type: "open_ended", sections: [...], criteria: [...], keyPoints: [...] }
- For "mcq" questions: rubric must have { type: "mcq", choices: [{label, text}, ...], correctAnswer: "A"|"B"|"C"|"D", explanation: "...", keyPoints: [...] }
- For "leetcode" questions: rubric must have { type: "leetcode", functionPrototype: "...", examples: [{input, output, explanation?}, ...], constraints: [...], keyPoints: [...] }

## Question Attributes
- Each question MUST have a short descriptive title (3-8 words)
- Each question MUST specify its questionType: ${types
      .map((t) => `"${t}"`)
      .join(', ')}
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
- Distribute question types as evenly as possible across the requested types
- If the content is too thin for ${count} meaningful questions, generate fewer but note this`;

    const userPrompt = `Topic: ${topicName}
Note: ${noteName}
Chunk: ${chunkName}

Content:
${chunkContent}`;

    try {
      const { output, usage } = await generateText({
        model: llmModel as Parameters<typeof generateText>[0]['model'],
        maxRetries: 0,
        output: Output.object({
          schema: questionSchema,
        }),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.5,
      });

      const tokenUsage: TokenUsage = {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      };

      if (output.questions.length === 0) {
        this.logger.error('LLM returned no questions');
        return { questions: [], usage: tokenUsage, modelId };
      }

      this.logger.log(
        `Generated ${output.questions.length} questions for chunk "${chunkName}"`
      );
      return { questions: output.questions, usage: tokenUsage, modelId };
    } catch (err) {
      this.logger.error(`LLM generation failed: ${err}`);
      throw err;
    }
  }
}
