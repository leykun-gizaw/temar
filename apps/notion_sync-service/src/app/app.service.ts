import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';

@Injectable()
export class AppService {
  private notionClient: Client;

  constructor() {
    this.notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET,
    });
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
  async getPage(id: string) {
    return await this.notionClient.pages.retrieve({ page_id: id });
  }

  async createDatabasePage(
    dataSourceId: string,
    name: string,
    description: string,
    emoji: string
  ) {
    return await this.notionClient.pages.create({
      icon: { type: 'emoji', emoji },
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties: {
        Name: {
          title: [{ text: { content: name } }],
        },
        Description: {
          rich_text: [{ text: { content: description } }],
        },
      },
    });
  }

  async getBlock(id: string) {
    return await this.notionClient.blocks.retrieve({ block_id: id });
  }

  async getBlockChildren(id: string) {
    return await this.notionClient.blocks.children.list({ block_id: id });
  }

  async getDatabase(id: string) {
    return await this.notionClient.databases.retrieve({ database_id: id });
  }

  async getDataSource(id: string) {
    return await this.notionClient.dataSources.retrieve({ data_source_id: id });
  }

  async queryDataSource(id: string) {
    return await this.notionClient.dataSources.query({ data_source_id: id });
  }

  async createTopicsPage(parentPageId: string) {
    // Update page title
    await this.notionClient.pages.update({
      page_id: parentPageId,
      properties: {
        title: {
          title: [{ text: { content: 'Temar' } }],
        },
      },
      icon: { emoji: '📖' },
    });
    return await this.createPageContent(parentPageId, '📚 Topics');
  }

  async createNotesPage(parentPageId: string) {
    return await this.createPageContent(parentPageId, '📘 Notes');
  }

  async createChunksPage(parentPageId: string) {
    return await this.createPageContent(parentPageId, '📄 Chunks');
  }

  async createTopic(dataSourceId: string) {
    return await this.createDatabasePage(
      dataSourceId,
      'Sample Topic',
      'Sample topics demo description',
      '📚'
    );
  }

  async createNote(dataSourceId: string) {
    return await this.createDatabasePage(
      dataSourceId,
      'Sample Note',
      'Sample notes demo description',
      '📘'
    );
  }

  async createChunk(dataSourceId: string) {
    return await this.createDatabasePage(
      dataSourceId,
      'Sample Chunk',
      'Sample chunks demo description',
      '📄'
    );
  }

  private async createPageContent(parentPageId: string, headingTitle: string) {
    // Create heading
    await this.notionClient.blocks.children.append({
      block_id: parentPageId,
      children: [
        {
          heading_1: {
            rich_text: [
              {
                type: 'text',
                text: { content: headingTitle },
              },
            ],
            color: 'blue_background',
          },
        },
      ],
    });
    // Create datasource
    return await this.notionClient.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      initial_data_source: {
        properties: {
          Name: { type: 'title', title: {} },
          Description: { type: 'rich_text', rich_text: {} },
        },
      },
      title: [{ type: 'text', text: { content: headingTitle } }],
      is_inline: true,
    });
  }
}
