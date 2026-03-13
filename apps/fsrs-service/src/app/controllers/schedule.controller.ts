import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { RecallItemService } from '../services/recall-item.service';
import { FsrsEngineService } from '../services/fsrs-engine.service';

const USER_ID_HEADER = {
  name: 'x-user-id',
  description: 'User UUID',
  required: true,
};

@ApiTags('Schedule')
@Controller()
export class ScheduleController {
  constructor(
    private readonly recallItemService: RecallItemService,
    private readonly fsrsEngine: FsrsEngineService
  ) {}

  @ApiOperation({ summary: 'Get due recall items' })
  @ApiHeader(USER_ID_HEADER)
  @ApiQuery({
    name: 'topicId',
    required: false,
    description: 'Filter by topic',
  })
  @ApiQuery({ name: 'noteId', required: false, description: 'Filter by note' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max items to return',
  })
  @ApiSecurity('api-key')
  @Get('due')
  async getDueItems(
    @Headers('x-user-id') userId: string,
    @Query('topicId') topicId?: string,
    @Query('noteId') noteId?: string,
    @Query('limit') limit?: string
  ) {
    this.requireUserId(userId);
    const items = await this.recallItemService.getDueItems(userId, {
      topicId,
      noteId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { items, count: items.length };
  }

  @ApiOperation({ summary: 'Get count of due items' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Get('due/count')
  async getDueCount(@Headers('x-user-id') userId: string) {
    this.requireUserId(userId);
    const count = await this.recallItemService.getDueCount(userId);
    return { count };
  }

  @ApiOperation({ summary: 'Get all recall items (paginated)' })
  @ApiHeader(USER_ID_HEADER)
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size (default 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset (default 0)',
  })
  @ApiSecurity('api-key')
  @Get('recall-items')
  async getAllItems(
    @Headers('x-user-id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.getAllItems(userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @ApiOperation({ summary: 'Search recall items by name' })
  @ApiHeader(USER_ID_HEADER)
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiSecurity('api-key')
  @Get('recall-items/search')
  async searchItems(
    @Headers('x-user-id') userId: string,
    @Query('q') q: string
  ) {
    this.requireUserId(userId);
    if (!q) return { items: [] };
    const items = await this.recallItemService.searchItems(userId, q);
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get a single recall item with context' })
  @ApiParam({ name: 'id', description: 'Recall item UUID' })
  @ApiSecurity('api-key')
  @Get('recall-items/:id')
  async getRecallItem(@Param('id') id: string) {
    const item = await this.recallItemService.getItemById(id);
    if (!item) {
      throw new NotFoundException(`Recall item ${id} not found`);
    }
    return item;
  }

  @ApiOperation({ summary: 'Preview scheduling options for all 4 ratings' })
  @ApiParam({ name: 'id', description: 'Recall item UUID' })
  @ApiSecurity('api-key')
  @Get('recall-items/:id/preview')
  async getSchedulingPreview(@Param('id') id: string) {
    const item = await this.recallItemService.getItemById(id);
    if (!item) {
      throw new NotFoundException(`Recall item ${id} not found`);
    }

    const elapsed_days = item.lastReview
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(item.lastReview).getTime()) / 86_400_000
          )
        )
      : 0;

    const cardInput = {
      due: item.due,
      stability: item.stability,
      difficulty: item.difficulty,
      elapsed_days,
      scheduled_days: item.scheduledDays,
      reps: item.reps,
      lapses: item.lapses,
      learning_steps: item.learningSteps,
      state: item.state,
      last_review: item.lastReview ?? undefined,
    };

    const preview = this.fsrsEngine.getSchedulingOptions(cardInput);
    const Rating = this.fsrsEngine.ratingEnum;

    return {
      recallItemId: id,
      options: {
        again: {
          rating: Rating.Again,
          nextDue: preview[Rating.Again].card.due,
          nextState: preview[Rating.Again].card.state,
          scheduledDays: preview[Rating.Again].card.scheduled_days,
        },
        hard: {
          rating: Rating.Hard,
          nextDue: preview[Rating.Hard].card.due,
          nextState: preview[Rating.Hard].card.state,
          scheduledDays: preview[Rating.Hard].card.scheduled_days,
        },
        good: {
          rating: Rating.Good,
          nextDue: preview[Rating.Good].card.due,
          nextState: preview[Rating.Good].card.state,
          scheduledDays: preview[Rating.Good].card.scheduled_days,
        },
        easy: {
          rating: Rating.Easy,
          nextDue: preview[Rating.Easy].card.due,
          nextState: preview[Rating.Easy].card.state,
          scheduledDays: preview[Rating.Easy].card.scheduled_days,
        },
      },
    };
  }

  private requireUserId(userId: string | undefined): asserts userId is string {
    if (!userId) {
      throw new HttpException(
        'x-user-id header is required',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
