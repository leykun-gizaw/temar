import { Injectable } from '@nestjs/common';
import { Client, isFullBlock, isFullDatabase } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { dbClient, user } from '@temar/db-client';
import { eq } from 'drizzle-orm';

@Injectable()
export class AppService {
  private notionClient: Client;
  private n2m: NotionToMarkdown;

  constructor() {
    this.notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET,
    });
    this.n2m = new NotionToMarkdown({ notionClient: this.notionClient });
  }

  async getGreeting() {
    return { message: 'Hello API' };
  }

  async getUsersList() {
    return await dbClient.select().from(user);
  }

  async getUserById(id: string) {
    return await dbClient
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  async updateUserNotionPageId(id: string, notionPageId: string) {
    return await dbClient
      .update(user)
      .set({ notionPageId })
      .where(eq(user.id, id))
      .returning();
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

  async getBlockChildrenWithMd(id: string) {
    const response = await this.notionClient.blocks.children.list({
      block_id: id,
    });
    const mdBlocks = await this.n2m.blocksToMarkdown(response.results);
    const mdString = this.n2m.toMarkdownString(mdBlocks);
    return {
      results: response.results,
      contentMd: mdString.parent,
    };
  }

  async appendBlockChildren(blockId: string) {
    return await this.notionClient.blocks.children.append({
      block_id: blockId,
      children: [
        {
          heading_1: { rich_text: [{ text: { content: 'Hello, World 🌍' } }] },
        },
      ],
    });
  }

  async getDatabase(id: string) {
    return await this.notionClient.databases.retrieve({ database_id: id });
  }

  async getPageDatasourceId(id: string): Promise<string | null> {
    const pageChildren = (await this.getBlockChildren(id)).results;
    const pageDB = pageChildren.find((child) => {
      if (!isFullBlock(child)) return false;
      return child.type === 'child_database';
    });
    if (!pageDB) return null;
    const database = await this.getDatabase(pageDB.id);
    if (!isFullDatabase(database)) return null;
    if (!database.data_sources?.length) return null;
    return database.data_sources[0].id;
  }

  async getPageDatasourceList(id: string) {
    const pageChildren = (await this.getBlockChildren(id)).results;
    const pageDB = pageChildren.find((child) => {
      if (!isFullBlock(child)) return false;
      return child.type === 'child_database';
    });

    if (!pageDB) return null;
    const database = await this.getDatabase(pageDB.id);

    if (!isFullDatabase(database)) return null;
    if (!database.data_sources?.length) return null;
    const databaseDatasourceID = database.data_sources[0].id;
    const datasourcePagesList = (
      await this.queryDataSource(databaseDatasourceID)
    ).results;
    return datasourcePagesList;
  }

  async getDataSource(id: string) {
    return await this.notionClient.dataSources.retrieve({ data_source_id: id });
  }

  async queryDataSource(id: string) {
    return await this.notionClient.dataSources.query({ data_source_id: id });
  }

  async createTopicsPage(parentPageId: string) {
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

  async createPageDatabase(parentPageId: string, title: string) {
    return await this.notionClient.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      initial_data_source: {
        properties: {
          Name: { type: 'title', title: {} },
          Description: { type: 'rich_text', rich_text: {} },
        },
      },
      title: [{ type: 'text', text: { content: title } }],
      is_inline: true,
    });
  }

  /**
   * Create a topic with full child hierarchy:
   * topic page → notes database → sample note → chunks database → sample chunk
   */
  async createTopicCascade(
    datasourceId: string,
    name: string,
    description: string
  ) {
    const topicPage = await this.createDatabasePage(
      datasourceId,
      name,
      description,
      '📚'
    );

    const notesDatabase = await this.createNotesPage(topicPage.id);
    if (!isFullDatabase(notesDatabase) || !notesDatabase.data_sources?.length) {
      throw new Error('Failed to create notes database for topic');
    }
    const notePage = await this.createNote(notesDatabase.data_sources[0].id);

    const chunksDatabase = await this.createChunksPage(notePage.id);
    if (
      !isFullDatabase(chunksDatabase) ||
      !chunksDatabase.data_sources?.length
    ) {
      throw new Error('Failed to create chunks database for note');
    }
    const chunkPage = await this.createChunk(chunksDatabase.data_sources[0].id);

    return { topicPage, notesDatabase, notePage, chunksDatabase, chunkPage };
  }

  /**
   * Create a note with child hierarchy:
   * note page → chunks database → sample chunk
   */
  async createNoteCascade(
    datasourceId: string,
    name: string,
    description: string
  ) {
    const notePage = await this.createDatabasePage(
      datasourceId,
      name,
      description,
      '📘'
    );

    const chunksDatabase = await this.createChunksPage(notePage.id);
    if (
      !isFullDatabase(chunksDatabase) ||
      !chunksDatabase.data_sources?.length
    ) {
      throw new Error('Failed to create chunks database for note');
    }
    const chunkPage = await this.createChunk(chunksDatabase.data_sources[0].id);

    return { notePage, chunksDatabase, chunkPage };
  }

  /**
   * Archive (soft-delete) a Notion page.
   */
  async archivePage(pageId: string) {
    return await this.notionClient.pages.update({
      page_id: pageId,
      archived: true,
    });
  }

  /**
   * Update Name and Description properties of a Notion page.
   */
  async updatePageProperties(
    pageId: string,
    name: string,
    description: string
  ) {
    return await this.notionClient.pages.update({
      page_id: pageId,
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

  /**
   * Cascade-archive a page and all children in its child databases.
   * Walks: page → child_database blocks → datasource pages → archive each.
   */
  async cascadeArchivePage(pageId: string) {
    // Find child databases in this page
    const children = (await this.getBlockChildren(pageId)).results;
    for (const child of children) {
      if (!isFullBlock(child)) continue;
      if (child.type !== 'child_database') continue;

      const db = await this.getDatabase(child.id);
      if (!isFullDatabase(db) || !db.data_sources?.length) continue;

      const pages = (await this.queryDataSource(db.data_sources[0].id)).results;
      for (const page of pages) {
        // Recursively cascade-archive children first
        await this.cascadeArchivePage(page.id);
      }
    }
    // Finally archive this page itself
    await this.archivePage(pageId);
  }

  private async createPageContent(parentPageId: string, headingTitle: string) {
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
    return await this.createPageDatabase(parentPageId, headingTitle);
  }
}
