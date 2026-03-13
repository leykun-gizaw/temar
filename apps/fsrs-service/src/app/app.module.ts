import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { FsrsEngineService } from './services/fsrs-engine.service';
import { RecallItemService } from './services/recall-item.service';
import { ReviewService } from './services/review.service';
import { TrackingController } from './controllers/tracking.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { ReviewController } from './controllers/review.controller';

@Module({
  imports: [],
  controllers: [TrackingController, ScheduleController, ReviewController],
  providers: [
    FsrsEngineService,
    RecallItemService,
    ReviewService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
