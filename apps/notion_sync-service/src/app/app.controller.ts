import { Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('/block/:id')
  async getBlock(@Param('id') id: string) {
    return await this.appService.getBlock(id);
  }

  @Get('/block/:id/children')
  async getBlockChildren(@Param('id') id: string) {
    return await this.appService.getBlockChildren(id);
  }

  @Get('/page/:id')
  async getPage(@Param('id') id: string) {
    return await this.appService.getPage(id);
  }

  @Get('database/:id')
  async getDatabase(@Param('id') id: string) {
    return await this.appService.getDatabase(id);
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
    return chunkPage;
  }
}
