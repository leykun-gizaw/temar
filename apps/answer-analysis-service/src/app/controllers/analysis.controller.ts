import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { AnswerAnalysisService } from '../services/answer-analysis.service';
import type { AiConfig } from '../services/llm.service';

@ApiTags('Analysis')
@Controller('analyze')
export class AnalysisController {
  constructor(
    private readonly answerAnalysisService: AnswerAnalysisService
  ) {}

  @ApiOperation({ summary: 'Analyze a user answer against a question rubric' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User UUID',
    required: true,
  })
  @ApiSecurity('api-key')
  @Post()
  async analyzeAnswer(
    @Headers('x-user-id') userId: string,
    @Headers('x-ai-provider') aiProvider?: string,
    @Headers('x-ai-model') aiModel?: string,
    @Headers('x-ai-api-key') aiApiKey?: string,
    @Body()
    body?: {
      answer: string;
      questionTitle: string;
      questionText: string;
      criteria: string[];
      keyPoints: string[];
    }
  ) {
    if (!userId) {
      throw new HttpException(
        'x-user-id header is required',
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !body?.answer ||
      !body?.questionTitle ||
      !body?.questionText ||
      !body?.criteria?.length ||
      !body?.keyPoints?.length
    ) {
      throw new HttpException(
        'Missing required fields: answer, questionTitle, questionText, criteria, keyPoints',
        HttpStatus.BAD_REQUEST
      );
    }

    const aiConfig: AiConfig | undefined =
      aiProvider || aiModel || aiApiKey
        ? {
            ...(aiProvider && { provider: aiProvider }),
            ...(aiModel && { model: aiModel }),
            ...(aiApiKey && { apiKey: aiApiKey }),
          }
        : undefined;

    return this.answerAnalysisService.analyze(
      {
        answer: body.answer,
        questionTitle: body.questionTitle,
        questionText: body.questionText,
        criteria: body.criteria,
        keyPoints: body.keyPoints,
      },
      aiConfig
    );
  }
}
