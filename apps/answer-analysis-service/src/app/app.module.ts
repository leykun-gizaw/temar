import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { AnalysisController } from './controllers/analysis.controller';
import { AnswerAnalysisService } from './services/answer-analysis.service';
import { LlmService } from './services/llm.service';

@Module({
  controllers: [AnalysisController],
  providers: [
    AnswerAnalysisService,
    LlmService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
