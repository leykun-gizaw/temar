import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Patch,
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
import { Client } from '@notionhq/client';
import { NotionAuthService } from './services/notion-auth.service';
import { NotionApiService } from './services/notion-api.service';
import {
  NotionContentService,
  CascadeResult,
  NoteCascadeResult,
  ChunkResult,
} from './services/notion-content.service';
import { UserRepository } from './services/user.repository';

const USER_ID_HEADER = {
  name: 'x-user-id',
  description: 'ID of the authenticated user',
  required: true,
} as const;

const ENTITY_BODY = {
  schema: {
    properties: {
      datasourceId: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
    },
  },
} as const;

@ApiTags('Notion Sync')
@ApiSecurity('api-key')
@Controller()
export class AppController {
  constructor(
    private readonly notionAuth: NotionAuthService,
    private readonly notionApi: NotionApiService,
    private readonly notionContent: NotionContentService,
    private readonly userRepository: UserRepository
  ) {}

  @ApiOperation({ summary: 'List all users' })
  @Get('/users')
  async listUsers() {
    return this.userRepository.findAll();
  }

  @ApiOperation({ summary: 'Find user by ID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @Get('/user/:userId')
  async findUser(@Param('userId') userId: string) {
    return this.userRepository.findById(userId);
  }

  @ApiOperation({ summary: 'Set Notion master page ID for a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiBody({ schema: { properties: { notionPageId: { type: 'string' } } } })
  @Post('/user/:userId/notion_page')
  async updateUserNotionPageId(
    @Param('userId') userId: string,
    @Body('notionPageId') notionPageId: string
  ) {
    return this.userRepository.updateNotionPageId(userId, notionPageId);
  }

  @ApiOperation({ summary: 'Retrieve a Notion block' })
  @ApiParam({ name: 'blockId', description: 'Notion block UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('/block/:blockId')
  async retrieveBlock(
    @Param('blockId') blockId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.retrieveBlock(client, blockId);
  }

  @ApiOperation({ summary: 'List child blocks of a Notion block' })
  @ApiParam({ name: 'blockId', description: 'Notion block UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('/block/:blockId/children')
  async listBlockChildren(
    @Param('blockId') blockId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.listBlockChildren(client, blockId);
  }

  @ApiOperation({ summary: 'Append children to a Notion block' })
  @ApiParam({ name: 'blockId', description: 'Notion block UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Patch('/block/:blockId/appendChildren')
  async appendBlockChildren(
    @Param('blockId') blockId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.appendBlockChildren(client, blockId);
  }

  @ApiOperation({ summary: 'Retrieve a Notion page' })
  @ApiParam({ name: 'pageId', description: 'Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('/page/:pageId')
  async retrievePage(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.retrievePage(client, pageId);
  }

  @ApiOperation({ summary: 'Update Name and Description on a Notion page' })
  @ApiParam({ name: 'pageId', description: 'Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @ApiBody({
    schema: {
      properties: { name: { type: 'string' }, description: { type: 'string' } },
    },
  })
  @Patch('page/:pageId/properties')
  async updatePageProperties(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.updatePageProperties(client, pageId, {
      name,
      description,
    });
  }

  @ApiOperation({ summary: 'List datasource pages under a Notion page' })
  @ApiParam({ name: 'pageId', description: 'Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('/page/:pageId/get_datasource_list')
  async listChildDatasourcePages(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.listChildDatasourcePages(client, pageId);
  }

  @ApiOperation({ summary: 'Retrieve a Notion database' })
  @ApiParam({ name: 'databaseId', description: 'Notion database UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('database/:databaseId')
  async retrieveDatabase(
    @Param('databaseId') databaseId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.retrieveDatabase(client, databaseId);
  }

  @ApiOperation({ summary: 'Create an inline database under a Notion page' })
  @ApiParam({ name: 'pageId', description: 'Parent Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @ApiBody({ schema: { properties: { title: { type: 'string' } } } })
  @Post('page/:pageId/create_page_database')
  async createPageDatabase(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string,
    @Body('title') title: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.createPageDatabase(client, pageId, title);
  }

  @ApiOperation({ summary: 'Retrieve a Notion datasource' })
  @ApiParam({ name: 'datasourceId', description: 'Notion datasource UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('datasource/:datasourceId')
  async retrieveDataSource(
    @Param('datasourceId') datasourceId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.retrieveDataSource(client, datasourceId);
  }

  @ApiOperation({ summary: 'Create a sample topic page in a datasource' })
  @ApiParam({ name: 'datasourceId', description: 'Notion datasource UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Post('datasource/:datasourceId/create_topics')
  async createSampleTopic(
    @Param('datasourceId') datasourceId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.createDatabasePage(client, {
      datasourceId,
      name: 'Sample Topic',
      description: 'Sample topics demo description',
      emoji: '📚',
    });
  }

  @ApiOperation({ summary: 'List all pages in a datasource' })
  @ApiParam({ name: 'datasourceId', description: 'Notion datasource UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('datasource/:datasourceId/pages')
  async listDatasourcePages(
    @Param('datasourceId') datasourceId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    return this.notionApi.queryDataSource(client, datasourceId);
  }

  @ApiOperation({
    summary: 'Scaffold master page with topic/note/chunk cascade',
  })
  @ApiParam({ name: 'pageId', description: 'Master Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Post('page/:pageId/prep_notion')
  async scaffoldMasterPage(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string
  ): Promise<CascadeResult> {
    const client = await this.resolveNotionClient(userId);
    return this.notionContent.scaffoldMasterPage(client, pageId);
  }

  @ApiOperation({
    summary: 'Create a topic with note + chunk cascade in Notion',
  })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @ApiBody(ENTITY_BODY)
  @Post('topic/create')
  async createTopicCascade(
    @Headers('x-user-id') userId: string,
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ): Promise<CascadeResult> {
    const client = await this.resolveNotionClient(userId);
    return this.notionContent.createTopicFromDatasource(client, {
      datasourceId,
      name,
      description,
    });
  }

  @ApiOperation({ summary: 'Create a note with chunk cascade in Notion' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @ApiBody(ENTITY_BODY)
  @Post('note/create')
  async createNoteCascade(
    @Headers('x-user-id') userId: string,
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ): Promise<NoteCascadeResult> {
    const client = await this.resolveNotionClient(userId);
    return this.notionContent.createNoteFromDatasource(client, {
      datasourceId,
      name,
      description,
    });
  }

  @ApiOperation({ summary: 'Create a single chunk page in Notion' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @ApiBody(ENTITY_BODY)
  @Post('chunk/create')
  async createChunk(
    @Headers('x-user-id') userId: string,
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ): Promise<ChunkResult> {
    const client = await this.resolveNotionClient(userId);
    return this.notionContent.createChunkFromDatasource(client, {
      datasourceId,
      name,
      description,
    });
  }

  @ApiOperation({ summary: 'List block children with markdown conversion' })
  @ApiParam({ name: 'blockId', description: 'Notion block UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Get('/block/:blockId/children_with_md')
  async listBlockChildrenWithMarkdown(
    @Param('blockId') blockId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    const children = await this.notionApi.listBlockChildren(client, blockId);
    const contentMd = this.blocksToMarkdown(children.results);
    return { ...children, contentMd };
  }

  @ApiOperation({ summary: 'Archive a page and all its descendants in Notion' })
  @ApiParam({ name: 'pageId', description: 'Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Delete('page/:pageId/cascade')
  async cascadeArchivePage(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    const pageIds = await this.collectDescendantPageIds(pageId);
    for (const id of pageIds) {
      await this.notionApi.archivePage(client, id);
    }
    await this.notionApi.archivePage(client, pageId);
    return { archived: [pageId, ...pageIds] };
  }

  @ApiOperation({ summary: 'Archive a single page in Notion' })
  @ApiParam({ name: 'pageId', description: 'Notion page UUID' })
  @ApiHeader(USER_ID_HEADER)
  @ApiSecurity('user-id')
  @Delete('page/:pageId')
  async archiveSinglePage(
    @Param('pageId') pageId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.resolveNotionClient(userId);
    await this.notionApi.archivePage(client, pageId);
    return { archived: [pageId] };
  }

  private async collectDescendantPageIds(pageId: string): Promise<string[]> {
    const entity = await this.userRepository.identifyEntity(pageId);
    if (!entity) return [];

    if (entity.type === 'topic') {
      const noteIds = await this.userRepository.findNoteIdsByTopic(pageId);
      const chunkIds: string[] = [];
      for (const noteId of noteIds) {
        const chunks = await this.userRepository.findChunkIdsByNote(noteId);
        chunkIds.push(...chunks);
      }
      return [...chunkIds, ...noteIds];
    }

    if (entity.type === 'note') {
      return this.userRepository.findChunkIdsByNote(pageId);
    }

    return [];
  }

  private blocksToMarkdown(blocks: unknown[]): string {
    return blocks
      .map((block) => {
        const b = block as Record<string, unknown>;
        const type = b['type'] as string | undefined;
        if (!type) return '';

        const content = b[type] as
          | { rich_text?: Array<{ plain_text?: string }> }
          | undefined;
        const text =
          content?.rich_text?.map((rt) => rt.plain_text ?? '').join('') ?? '';

        switch (type) {
          case 'heading_1':
            return `# ${text}`;
          case 'heading_2':
            return `## ${text}`;
          case 'heading_3':
            return `### ${text}`;
          case 'bulleted_list_item':
            return `- ${text}`;
          case 'numbered_list_item':
            return `1. ${text}`;
          case 'to_do': {
            const checked = (b[type] as { checked?: boolean })?.checked;
            return `- [${checked ? 'x' : ' '}] ${text}`;
          }
          case 'code':
            return `\`\`\`\n${text}\n\`\`\``;
          case 'quote':
            return `> ${text}`;
          case 'divider':
            return '---';
          default:
            return text;
        }
      })
      .filter(Boolean)
      .join('\n\n');
  }

  private async resolveNotionClient(
    userId: string | undefined
  ): Promise<Client> {
    if (!userId) {
      throw new HttpException(
        'X-User-Id header is required',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.notionAuth.resolveClient(userId);
  }
}
