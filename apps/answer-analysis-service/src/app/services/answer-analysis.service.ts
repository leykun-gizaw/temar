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
    const { analysis, usage, modelId } = await this.llmService.analyzeAnswer(
      request.answer,
      request.questionTitle,
      request.questionText,
      request.criteria,
      request.keyPoints,
      aiConfig
    );

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
