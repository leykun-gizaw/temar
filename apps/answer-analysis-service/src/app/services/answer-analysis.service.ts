import { Injectable, Logger } from '@nestjs/common';
import { LlmService, AiConfig, AnalysisOutput } from './llm.service';

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
    aiConfig?: AiConfig
  ): Promise<AnalysisResult> {
    const output = await this.llmService.analyzeAnswer(
      request.answer,
      request.questionTitle,
      request.questionText,
      request.criteria,
      request.keyPoints,
      aiConfig
    );

    const { rating, label } = percentToRating(output.scorePercent);

    this.logger.log(
      `Analysis for "${request.questionTitle}": ${output.scorePercent}% → ${label} (${rating})`
    );

    return {
      ...output,
      suggestedRating: rating,
      suggestedLabel: label,
    };
  }
}
