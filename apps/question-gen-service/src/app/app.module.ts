import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { LlmService } from './services/llm.service';
import { QuestionGenerationService } from './services/question-generation.service';
import { GenerationController } from './controllers/generation.controller';

@Module({
  imports: [],
  controllers: [GenerationController],
  providers: [
    LlmService,
    QuestionGenerationService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
