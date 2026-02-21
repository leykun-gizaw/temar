import {
  Controller,
  Post,
  Get,
  Param,
  Body,
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
  ApiQuery,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { ReviewService } from '../services/review.service';
import type { Grade } from 'ts-fsrs';

const USER_ID_HEADER = {
  name: 'x-user-id',
  description: 'User UUID',
  required: true,
};

@ApiTags('Review')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: 'Submit a review rating for a recall item' })
  @ApiParam({ name: 'id', description: 'Recall item UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: {
          type: 'number',
          description: '1=Again, 2=Hard, 3=Good, 4=Easy',
        },
        durationMs: {
          type: 'number',
          description: 'Time spent answering in ms (optional)',
        },
        answerJson: {
          type: 'object',
          description:
            'Plate.js editor JSON value of the user answer (optional)',
        },
      },
      required: ['rating'],
    },
  })
  @ApiSecurity('api-key')
  @Post('recall-items/:id/review')
  async submitReview(
    @Param('id') id: string,
    @Body() body: { rating: number; durationMs?: number; answerJson?: unknown }
  ) {
    if (!body.rating || body.rating < 1 || body.rating > 4) {
      throw new HttpException(
        'Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.reviewService.submitReview(
      id,
      body.rating as Grade,
      body.durationMs,
      body.answerJson
    );
  }

  @ApiOperation({ summary: 'Get review history for a recall item' })
  @ApiParam({ name: 'id', description: 'Recall item UUID' })
  @ApiSecurity('api-key')
  @Get('recall-items/:id/history')
  async getReviewHistory(@Param('id') id: string) {
    return this.reviewService.getReviewHistory(id);
  }

  @ApiOperation({ summary: 'Get review logs for a date range (analytics)' })
  @ApiHeader(USER_ID_HEADER)
  @ApiQuery({
    name: 'from',
    required: true,
    description: 'Start date ISO string',
  })
  @ApiQuery({ name: 'to', required: true, description: 'End date ISO string' })
  @ApiSecurity('api-key')
  @Get('review-logs')
  async getReviewLogs(
    @Headers('x-user-id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string
  ) {
    if (!userId) {
      throw new HttpException(
        'x-user-id header is required',
        HttpStatus.BAD_REQUEST
      );
    }
    if (!from || !to) {
      throw new HttpException(
        'from and to query params are required',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.reviewService.getReviewLogsByDateRange(
      userId,
      new Date(from),
      new Date(to)
    );
  }
}
