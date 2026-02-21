import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { QuestionGenerationService } from '../services/question-generation.service';

const USER_ID_HEADER = {
  name: 'x-user-id',
  description: 'User UUID',
  required: true,
};

@ApiTags('Generation')
@Controller('generate')
export class GenerationController {
  constructor(private readonly generationService: QuestionGenerationService) {}

  @ApiOperation({ summary: 'Generate questions for a single chunk' })
  @ApiParam({ name: 'chunkId', description: 'Chunk UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post(':chunkId')
  async generateForChunk(
    @Param('chunkId') chunkId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.generationService.generateForChunk(chunkId, userId);
  }

  @ApiOperation({ summary: 'Generate questions for multiple chunks' })
  @ApiHeader(USER_ID_HEADER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chunkIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of chunk UUIDs',
        },
      },
      required: ['chunkIds'],
    },
  })
  @ApiSecurity('api-key')
  @Post('batch')
  async generateBatch(
    @Headers('x-user-id') userId: string,
    @Body() body: { chunkIds: string[] }
  ) {
    this.requireUserId(userId);
    if (!Array.isArray(body.chunkIds) || body.chunkIds.length === 0) {
      throw new HttpException(
        'chunkIds must be a non-empty array',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.generationService.generateBatch(body.chunkIds, userId);
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
    return this.generationService.retryChunk(chunkId, userId);
  }

  @ApiOperation({ summary: 'Retry all failed generations for a user' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Post('retry-failed')
  async retryAllFailed(@Headers('x-user-id') userId: string) {
    this.requireUserId(userId);
    return this.generationService.retryAllFailed(userId);
  }

  @ApiOperation({ summary: 'Check generation status for a chunk' })
  @ApiParam({ name: 'chunkId', description: 'Chunk UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('api-key')
  @Get('status/:chunkId')
  async getStatus(
    @Param('chunkId') chunkId: string,
    @Headers('x-user-id') userId: string
  ) {
    this.requireUserId(userId);
    return this.generationService.getStatus(chunkId, userId);
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
