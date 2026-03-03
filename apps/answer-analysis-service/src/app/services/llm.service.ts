import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const analysisSchema = z.object({
  scorePercent: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall score as a percentage (0-100)'),
  strengths: z
    .array(z.string())
    .describe('Specific strengths identified in the answer'),
  weaknesses: z
    .array(z.string())
    .describe('Specific weaknesses or missing elements in the answer'),
  reasoning: z
    .string()
    .describe('Brief explanation of the overall assessment'),
});

export type AnalysisOutput = z.infer<typeof analysisSchema>;

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

  async analyzeAnswer(
    answer: string,
    questionTitle: string,
    questionText: string,
    criteria: string[],
    keyPoints: string[],
    aiConfig?: AiConfig
  ): Promise<AnalysisOutput> {
    const llmModel = this.resolveModel(aiConfig);

    const systemPrompt = `You are a precise, fair grading assistant for a spaced-repetition study system.

## Your Role
Evaluate a student's answer against a question rubric. Be strict on factual accuracy but fair on phrasing variations.

## Scoring Rules
- Award credit for correct concepts even if worded differently from the key points
- Do NOT penalize for extra correct information beyond what was asked
- Do NOT award credit for vague, hand-wavy, or overly generic statements
- Partial credit is expected — an answer covering 3 of 5 key points deserves ~60%
- An empty or irrelevant answer scores 0%
- A perfect answer covering all key points with good structure scores 90-100%

## Output
Return a scorePercent (0-100), specific strengths, specific weaknesses, and a brief reasoning summary.
Keep strengths and weaknesses concise (1 sentence each). Limit to 3-5 items per list.`;

    const userPrompt = `## Question
**Title:** ${questionTitle}
**Question:** ${questionText}

## Rubric
**Criteria (answer structure guidance):**
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Key Points (expected facts/details):**
${keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}

## Student's Answer
${answer}`;

    try {
      const { output } = await generateText({
        model: llmModel as Parameters<typeof generateText>[0]['model'],
        maxRetries: 0,
        output: Output.object({
          schema: analysisSchema,
        }),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });

      this.logger.log(
        `Analysis complete for "${questionTitle}": ${output.scorePercent}%`
      );
      return output;
    } catch (err) {
      this.logger.error(`LLM analysis failed: ${err}`);
      throw err;
    }
  }
}
