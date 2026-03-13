import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { ApiKeyGuard } from './api-key.guard';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';
import { NotionAuthService } from './services/notion-auth.service';
import { NotionApiService } from './services/notion-api.service';
import { NotionContentService } from './services/notion-content.service';
import { UserRepository } from './services/user.repository';

@Module({
  imports: [],
  controllers: [AppController, WebhookController],
  providers: [
    NotionAuthService,
    NotionApiService,
    NotionContentService,
    UserRepository,
    WebhookService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
