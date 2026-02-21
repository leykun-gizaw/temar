import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { RecallItemService } from '../services/recall-item.service';

const USER_ID_HEADER = {
  name: 'x-user-id',
  description: 'User UUID',
  required: true,
};

@ApiTags('Tracking')
@Controller('track')
export class TrackingController {
  constructor(private readonly recallItemService: RecallItemService) {}

  @ApiOperation({ summary: 'Track all chunks under a topic (cascade)' })
  @ApiParam({ name: 'topicId', description: 'Topic UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('topic/:topicId')
  async trackTopic(
    @Param('topicId') topicId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.trackTopic(topicId, userId);
  }

  @ApiOperation({ summary: 'Track all chunks under a note (cascade)' })
  @ApiParam({ name: 'noteId', description: 'Note UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('note/:noteId')
  async trackNote(
    @Param('noteId') noteId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.trackNote(noteId, userId);
  }

  @ApiOperation({ summary: 'Track a single chunk' })
  @ApiParam({ name: 'chunkId', description: 'Chunk UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('chunk/:chunkId')
  async trackChunk(
    @Param('chunkId') chunkId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.trackChunk(chunkId, userId);
  }

  @ApiOperation({ summary: 'Untrack all chunks under a topic' })
  @ApiParam({ name: 'topicId', description: 'Topic UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Delete('topic/:topicId')
  async untrackTopic(
    @Param('topicId') topicId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.untrackTopic(topicId, userId);
  }

  @ApiOperation({ summary: 'Untrack all chunks under a note' })
  @ApiParam({ name: 'noteId', description: 'Note UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Delete('note/:noteId')
  async untrackNote(
    @Param('noteId') noteId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.untrackNote(noteId, userId);
  }

  @ApiOperation({ summary: 'Untrack a single chunk' })
  @ApiParam({ name: 'chunkId', description: 'Chunk UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Delete('chunk/:chunkId')
  async untrackChunk(
    @Param('chunkId') chunkId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.untrackChunk(chunkId, userId);
  }

  @ApiOperation({ summary: 'List all tracked items for a user' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Get('status')
  async getTrackingStatus(@Headers('x-user-id') userId: string) {
    this.requireUserId(userId);
    return this.recallItemService.getTrackedStatus(userId);
  }

  @ApiOperation({ summary: 'Retry generation for a single failed chunk' })
  @ApiParam({ name: 'chunkId', description: 'Chunk UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('retry/:chunkId')
  async retryChunk(
    @Param('chunkId') chunkId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.retryChunk(chunkId, userId);
  }

  @ApiOperation({ summary: 'Retry all failed generations for a user' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('retry-all-failed')
  async retryAllFailed(@Headers('x-user-id') userId: string) {
    this.requireUserId(userId);
    return this.recallItemService.retryAllFailed(userId);
  }

  @ApiOperation({ summary: 'Get underperforming chunks for a user' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Get('underperforming')
  async getUnderperformingChunks(
    @Headers('x-user-id') userId: string,
    @Query('minLapses') minLapses?: string,
    @Query('maxStability') maxStability?: string
  ) {
    this.requireUserId(userId);
    return this.recallItemService.getUnderperformingChunks(
      userId,
      minLapses ? parseInt(minLapses, 10) : undefined,
      maxStability ? parseFloat(maxStability) : undefined
    );
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
