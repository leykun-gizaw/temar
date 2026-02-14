import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.controller.ts
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.controller.ts
  Delete,
=======
  Headers,
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.controller.ts
=======
  Headers,
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.controller.ts
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Client, isFullDatabase } from '@notionhq/client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private async getClient(userId: string | undefined): Promise<Client> {
    if (!userId) {
      throw new HttpException(
        'X-User-Id header is required',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.appService.getNotionClientForUser(userId);
  }

  @Get()
  getGreeting() {
    return this.appService.getGreeting();
  }

  @Get('/users')
  async getUsers() {
    return await this.appService.getUsersList();
  }

  @Get('/user/:id')
  async getUserById(@Param('id') id: string) {
    return await this.appService.getUserById(id);
  }

  @Post('/user/:id/notion_page')
  async updateUserNotionPageId(
    @Param('id') id: string,
    @Body('notionPageId') notionPageId: string
  ) {
    return await this.appService.updateUserNotionPageId(id, notionPageId);
  }

  @Get('/block/:id')
  async getBlock(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.getBlock(client, id);
  }

  @Get('/block/:id/children')
  async getBlockChildren(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.getBlockChildren(client, id);
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.controller.ts
  }

  @Get('/block/:id/children_with_md')
  async getBlockChildrenWithMd(@Param('id') id: string) {
    return await this.appService.getBlockChildrenWithMd(id);
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.controller.ts
  }

  @Patch('/block/:id/appendChildren')
  async appendBlockChildren(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.appendBlockChildren(client, id);
  }

  @Get('/page/:id')
  async getPage(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    const client = await this.getClient(userId);
    return await this.appService.getPage(client, id);
  }

  @Patch('page/:id/properties')
  async updatePageProperties(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.updatePageProperties(
      client,
      id,
      name,
      description
    );
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.controller.ts
  }

  @Get('/page/:id/datasource_id')
  async getPageDatasourceId(@Param('id') id: string) {
    const datasourceId = await this.appService.getPageDatasourceId(id);
    return { datasourceId };
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.controller.ts
  }

  @Get('/page/:id/get_datasource_list')
  async getPageDatasourceList(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.getPageDatasourceList(client, id);
  }

  @Get('database/:id')
  async getDatabase(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.getDatabase(client, id);
  }

  @Post('page/:id/create_page_database')
  async createPageDatabase(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body('title') title: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.createPageDatabase(client, id, title);
  }

  @Get('datasource/:id')
  async getDataSource(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.getDataSource(client, id);
  }

  @Post('datasource/:id/create_topics')
  async createTopics(
    @Param('id') datasourceId: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.createTopic(client, datasourceId);
  }

  @Get('datasource/:id/pages')
  async getDataSourcePages(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    return await this.appService.queryDataSource(client, id);
  }

  @Post('page/:id/prep_notion')
  async createTopicsPage(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    const client = await this.getClient(userId);
    const topicsDatabase = await this.appService.createTopicsPage(client, id);

    if (!isFullDatabase(topicsDatabase))
      throw new HttpException(
        'Failed to create topics database',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    if (!topicsDatabase.data_sources?.length)
      throw new HttpException(
        'Topics database has no data sources',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    const topicPage = await this.appService.createTopic(
      client,
      topicsDatabase.data_sources[0].id
    );

    const notesDatabase = await this.appService.createNotesPage(
      client,
      topicPage.id
    );
    if (!isFullDatabase(notesDatabase))
      throw new HttpException(
        'Failed to create notes database',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    if (!notesDatabase.data_sources?.length)
      throw new HttpException(
        'Notes database has no data sources',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    const notePage = await this.appService.createNote(
      client,
      notesDatabase.data_sources[0].id
    );

    const chunksDatabase = await this.appService.createChunksPage(
      client,
      notePage.id
    );
    if (!isFullDatabase(chunksDatabase))
      throw new HttpException(
        'Failed to create chunks database',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    if (!chunksDatabase.data_sources?.length)
      throw new HttpException(
        'Chunks database has no data sources',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    const chunkPage = await this.appService.createChunk(
      client,
      chunksDatabase.data_sources[0].id
    );
    return { topicPage, notePage, chunkPage };
  }

  @Post('topic/create')
  async createTopicCascade(
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    return await this.appService.createTopicCascade(
      datasourceId,
      name,
      description
    );
  }

  @Post('note/create')
  async createNoteCascade(
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    return await this.appService.createNoteCascade(
      datasourceId,
      name,
      description
    );
  }

  @Post('chunk/create')
  async createChunkPage(
    @Body('datasourceId') datasourceId: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    return await this.appService.createDatabasePage(
      datasourceId,
      name,
      description,
      '📄'
    );
  }

  @Patch('page/:id/properties')
  async updatePageProperties(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    return await this.appService.updatePageProperties(id, name, description);
  }

  @Delete('page/:id')
  async archivePage(@Param('id') id: string) {
    return await this.appService.archivePage(id);
  }

  @Delete('page/:id/cascade')
  async cascadeArchivePage(@Param('id') id: string) {
    return await this.appService.cascadeArchivePage(id);
  }
}
