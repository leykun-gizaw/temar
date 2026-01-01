import { Controller, Get, Param, Post, Body, Patch } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  async getBlock(@Param('id') id: string) {
    return await this.appService.getBlock(id);
  }

  @Get('/block/:id/children')
  async getBlockChildren(@Param('id') id: string) {
    return await this.appService.getBlockChildren(id);
  }

  @Patch('/block/:id/appendChildren')
  async appendBlockChildren(@Param('id') id: string) {
    return await this.appService.appendBlockChildren(id);
  }

  @Get('/page/:id')
  async getPage(@Param('id') id: string) {
    return await this.appService.getPage(id);
  }

  @Get('/page/:id/get_datasource_list')
  async getPageDatasourceList(@Param('id') id: string) {
    return await this.appService.getPageDatasourceList(id);
  }

  @Get('database/:id')
  async getDatabase(@Param('id') id: string) {
    return await this.appService.getDatabase(id);
  }

  @Post('page/:id/create_page_database')
  async createPageDatabase(
    @Param('id') id: string,
    @Body('title') title: string
  ) {
    return await this.appService.createPageDatabase(id, title);
  }

  @Get('datasource/:id')
  async getDataSource(@Param('id') id: string) {
    return await this.appService.getDataSource(id);
  }

  @Post('datasource/:id/create_topics')
  async createTopics(@Param('id') datasourceId: string) {
    return await this.appService.createTopic(datasourceId);
  }

  @Get('datasource/:id/pages')
  async getDataSourcePages(@Param('id') id: string) {
    return await this.appService.queryDataSource(id);
  }

  @Post('page/:id/prep_notion')
  async createTopicsPage(@Param('id') id: string) {
    const topicsDatabase = await this.appService.createTopicsPage(id);
    const topicPage = await this.appService.createTopic(
      topicsDatabase.data_sources[0].id
    );

    const notesDatabase = await this.appService.createNotesPage(topicPage.id);
    const notePage = await this.appService.createNote(
      notesDatabase.data_sources[0].id
    );

    const chunksDatabase = await this.appService.createChunksPage(notePage.id);
    const chunkPage = await this.appService.createChunk(
      chunksDatabase.data_sources[0].id
    );
    return { topicPage, notePage, chunkPage };
  }
}
