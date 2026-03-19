import { Injectable, Logger } from '@nestjs/common';
import {
  LlmService,
  AiConfig,
  AnalysisOutput,
  TokenUsage,
} from './llm.service';
import { recordUsage } from '@temar/pricing-service';

export interface AnalysisRequest {
  answer: string;
  questionTitle: string;
  questionText: string;
  criteria: string[];
  keyPoints: string[];
}

export interface AnalysisResult extends AnalysisOutput {
  suggestedRating: number;
  suggestedLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
  usage: TokenUsage;
  newBalance: number | null;
}

function percentToRating(percent: number): {
  rating: number;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
} {
  if (percent <= 25) return { rating: 1, label: 'Again' };
  if (percent <= 55) return { rating: 2, label: 'Hard' };
  if (percent <= 80) return { rating: 3, label: 'Good' };
  return { rating: 4, label: 'Easy' };
}

@Injectable()
export class AnswerAnalysisService {
  private readonly logger = new Logger(AnswerAnalysisService.name);

  constructor(private readonly llmService: LlmService) {}

  async analyze(
    request: AnalysisRequest,
    aiConfig?: AiConfig,
    userId?: string
  ): Promise<AnalysisResult> {
    // Exponential backoff with jitter (mirrors question-gen-service)
    const MAX_RETRIES = 5;
    const BASE_DELAY_MS = 5_000;
    let llmResult: Awaited<ReturnType<typeof this.llmService.analyzeAnswer>> = {
      analysis: { scorePercent: 0, strengths: [], weaknesses: [], reasoning: '' },
      usage: { inputTokens: 0, outputTokens: 0 },
      modelId: '',
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        llmResult = await this.llmService.analyzeAnswer(
          request.answer,
          request.questionTitle,
          request.questionText,
          request.criteria,
          request.keyPoints,
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
            `Retryable error on attempt ${attempt}/${MAX_RETRIES} for "${request.questionTitle}". Retrying in ${
              Math.round(delayMs / 100) / 10
            }s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }

    const { analysis, usage, modelId } = llmResult;

    const { rating, label } = percentToRating(analysis.scorePercent);

    this.logger.log(
      `Analysis for "${request.questionTitle}": ${analysis.scorePercent}% → ${label} (${rating})`
    );

    // Record usage and deduct passes
    const isByok = aiConfig?.byok ?? false;
    let newBalance: number | null = null;
    if (userId) {
      try {
        const usageResult = await recordUsage({
          userId,
          modelId,
          operationType: 'answer_analysis',
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          isByok,
        });
        newBalance = usageResult.newBalance;
      } catch (err: unknown) {
        this.logger.error(`recordUsage failed: ${err}`);
      }
    }

    return {
      ...analysis,
      suggestedRating: rating,
      suggestedLabel: label,
      usage,
      newBalance,
    };
  }
}
