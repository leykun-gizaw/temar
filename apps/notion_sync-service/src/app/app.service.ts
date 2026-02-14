import { Injectable, Logger } from '@nestjs/common';
import { Client, isFullBlock, isFullDatabase } from '@notionhq/client';
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
import { NotionToMarkdown } from 'notion-to-md';
import { dbClient, user } from '@temar/db-client';
=======
import { dbClient, user, decrypt, encrypt } from '@temar/db-client';
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
import { dbClient, user, decrypt, encrypt } from '@temar/db-client';
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
import { eq } from 'drizzle-orm';

@Injectable()
export class AppService {
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
  private notionClient: Client;
  private n2m: NotionToMarkdown;
=======
  private readonly logger = new Logger(AppService.name);
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
  private readonly logger = new Logger(AppService.name);
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts

  /**
   * Get a Notion Client authenticated with the given user's OAuth token.
   * Automatically refreshes the token if it has expired.
   */
  async getNotionClientForUser(userId: string): Promise<Client> {
    const [row] = await dbClient
      .select({
        notionAccessToken: user.notionAccessToken,
        notionRefreshToken: user.notionRefreshToken,
        notionTokenExpiresAt: user.notionTokenExpiresAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row?.notionAccessToken) {
      throw new Error(`User ${userId} has no Notion access token`);
    }

    let accessToken = decrypt(row.notionAccessToken);

    // Refresh if expired (or expiring within 5 minutes)
    const expiresAt = row.notionTokenExpiresAt;
    const buffer = 5 * 60 * 1000; // 5 min
    if (expiresAt && expiresAt.getTime() - buffer < Date.now()) {
      if (!row.notionRefreshToken) {
        throw new Error(`User ${userId} token expired and no refresh token`);
      }
      accessToken = await this.refreshToken(userId, row.notionRefreshToken);
    }

    return new Client({ auth: accessToken });
  }

  private async refreshToken(
    userId: string,
    encryptedRefreshToken: string
  ): Promise<string> {
    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing NOTION_OAUTH_CLIENT_ID or NOTION_OAUTH_CLIENT_SECRET'
      );
    }

    const refreshToken = decrypt(encryptedRefreshToken);
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${encoded}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
    this.n2m = new NotionToMarkdown({ notionClient: this.notionClient });
=======
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Token refresh failed for user ${userId}: ${body}`);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    const newAccessToken = data.access_token as string;
    const newRefreshToken = data.refresh_token as string | undefined;

    // Update DB with new tokens
    await dbClient
      .update(user)
      .set({
        notionAccessToken: encrypt(newAccessToken),
        ...(newRefreshToken
          ? { notionRefreshToken: encrypt(newRefreshToken) }
          : {}),
        notionTokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      })
      .where(eq(user.id, userId));

    this.logger.log(`Refreshed Notion token for user ${userId}`);
    return newAccessToken;
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
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

  async getPage(client: Client, id: string) {
    return await client.pages.retrieve({ page_id: id });
  }

  async createDatabasePage(
    client: Client,
    dataSourceId: string,
    name: string,
    description: string,
    emoji: string
  ) {
    return await client.pages.create({
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

  async getBlock(client: Client, id: string) {
    return await client.blocks.retrieve({ block_id: id });
  }

  async getBlockChildren(client: Client, id: string) {
    return await client.blocks.children.list({ block_id: id });
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
  }

<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
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
=======
  async appendBlockChildren(client: Client, blockId: string) {
    return await client.blocks.children.append({
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
  }

  async appendBlockChildren(client: Client, blockId: string) {
    return await client.blocks.children.append({
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
      block_id: blockId,
      children: [
        {
          heading_1: { rich_text: [{ text: { content: 'Hello, World 🌍' } }] },
        },
      ],
    });
  }

  async getDatabase(client: Client, id: string) {
    return await client.databases.retrieve({ database_id: id });
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
  }

<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
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
=======
  async getPageDatasourceList(client: Client, id: string) {
    const pageChildren = (await this.getBlockChildren(client, id)).results;
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
  }

  async getPageDatasourceList(client: Client, id: string) {
    const pageChildren = (await this.getBlockChildren(client, id)).results;
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
    const pageDB = pageChildren.find((child) => {
      if (!isFullBlock(child)) return false;
      return child.type === 'child_database';
    });

    if (!pageDB) return null;
    const database = await this.getDatabase(client, pageDB.id);

    if (!isFullDatabase(database)) return null;
    if (!database.data_sources?.length) return null;
    const databaseDatasourceID = database.data_sources[0].id;
    const datasourcePagesList = (
      await this.queryDataSource(client, databaseDatasourceID)
    ).results;
    return datasourcePagesList;
  }

  async getDataSource(client: Client, id: string) {
    return await client.dataSources.retrieve({ data_source_id: id });
  }

  async queryDataSource(client: Client, id: string) {
    return await client.dataSources.query({ data_source_id: id });
  }

  async updatePageProperties(
    client: Client,
    id: string,
    name: string,
    description: string
  ) {
    return await client.pages.update({
      page_id: id,
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

  async createTopicsPage(client: Client, parentPageId: string) {
    await client.pages.update({
      page_id: parentPageId,
      properties: {
        title: {
          title: [{ text: { content: 'Temar' } }],
        },
      },
      icon: { emoji: '📖' },
    });
    return await this.createPageContent(client, parentPageId, '📚 Topics');
  }

  async createNotesPage(client: Client, parentPageId: string) {
    return await this.createPageContent(client, parentPageId, '📘 Notes');
  }

  async createChunksPage(client: Client, parentPageId: string) {
    return await this.createPageContent(client, parentPageId, '📄 Chunks');
  }

  async createTopic(client: Client, dataSourceId: string) {
    return await this.createDatabasePage(
      client,
      dataSourceId,
      'Sample Topic',
      'Sample topics demo description',
      '📚'
    );
  }

  async createNote(client: Client, dataSourceId: string) {
    return await this.createDatabasePage(
      client,
      dataSourceId,
      'Sample Note',
      'Sample notes demo description',
      '📘'
    );
  }

  async createChunk(client: Client, dataSourceId: string) {
    return await this.createDatabasePage(
      client,
      dataSourceId,
      'Sample Chunk',
      'Sample chunks demo description',
      '📄'
    );
  }

  async createPageDatabase(
    client: Client,
    parentPageId: string,
    title: string
  ) {
    return await client.databases.create({
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

<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
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
=======
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
  private async createPageContent(
    client: Client,
    parentPageId: string,
    headingTitle: string
  ) {
    await client.blocks.children.append({
<<<<<<< /Users/leykun/Documents/github-repos/Temar Application Files/temar/apps/notion_sync-service/src/app/app.service.ts
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
=======
>>>>>>> /Users/leykun/.windsurf/worktrees/temar/temar-ea7031a5/apps/notion_sync-service/src/app/app.service.ts
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
    return await this.createPageDatabase(client, parentPageId, headingTitle);
  }
}
