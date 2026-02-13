import { Injectable, Logger } from '@nestjs/common';
import { Client, isFullDatabase } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { dbClient, user, topic, note, chunk } from '@temar/db-client';
import { eq } from 'drizzle-orm';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

type NotionPageProperties = {
  Name: Extract<PageObjectResponse['properties'][string], { type: 'title' }>;
  Description: Extract<
    PageObjectResponse['properties'][string],
    { type: 'rich_text' }
  >;
};

interface NotionPage extends PageObjectResponse {
  properties: NotionPageProperties;
  parent:
    | Extract<PageObjectResponse['parent'], { type: 'data_source_id' }>
    | Extract<PageObjectResponse['parent'], { type: 'database_id' }>
    | Extract<PageObjectResponse['parent'], { type: 'page_id' }>;
}

interface WebhookEvent {
  id: string;
  timestamp: string;
  type: string;
  entity: { id: string; type: string };
  data: {
    parent?: { id: string; type: string };
    updated_properties?: string[];
    updated_blocks?: { id: string; type: string }[];
  };
}

type EntityType = 'topic' | 'note' | 'chunk' | null;

interface ResolvedEntity {
  entityType: EntityType;
  datasourceId: string;
  databaseId: string;
  userId: string | null;
  parentEntityId: string | null;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private notionClient: Client;
  private n2m: NotionToMarkdown;

  constructor() {
    this.notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET,
    });
    this.n2m = new NotionToMarkdown({ notionClient: this.notionClient });
  }

  async handlePageCreated(event: WebhookEvent) {
    const pageId = event.entity.id;
    this.logger.log(`page.created: ${pageId}`);
    await this.upsertPage(pageId);
  }

  async handlePagePropertiesUpdated(event: WebhookEvent) {
    const pageId = event.entity.id;
    this.logger.log(`page.properties_updated: ${pageId}`);
    await this.upsertPage(pageId);
  }

  async handlePageContentUpdated(event: WebhookEvent) {
    const pageId = event.entity.id;
    this.logger.log(`page.content_updated: ${pageId}`);

    try {
      // Content updates matter primarily for chunks — refresh block children
      const existing = await dbClient
        .select({ id: chunk.id })
        .from(chunk)
        .where(eq(chunk.id, pageId));

      if (existing.length) {
        const { contentJson, contentMd } = await this.fetchBlockChildrenWithMd(
          pageId
        );
        await dbClient
          .update(chunk)
          .set({ contentJson, contentMd })
          .where(eq(chunk.id, pageId));
        this.logger.log(`Updated chunk content: ${pageId}`);
      } else {
        // Page might not be in DB yet (race with page.created); full upsert
        this.logger.log(
          `page.content_updated for unknown page ${pageId}, attempting upsert`
        );
        await this.upsertPage(pageId);
      }
    } catch (err) {
      this.logger.error(
        `Error handling page.content_updated for ${pageId}`,
        err
      );
    }
  }

  async handlePageDeleted(event: WebhookEvent) {
    const pageId = event.entity.id;
    this.logger.log(`page.deleted: ${pageId}`);

    try {
      // Delete from whichever table contains this ID
      // Cascade deletes will handle children (topic→notes→chunks)
      const topicResult = await dbClient
        .delete(topic)
        .where(eq(topic.id, pageId))
        .returning({ id: topic.id });

      if (topicResult.length) {
        this.logger.log(`Deleted topic (+ cascaded notes/chunks): ${pageId}`);
        return;
      }

      const noteResult = await dbClient
        .delete(note)
        .where(eq(note.id, pageId))
        .returning({ id: note.id });

      if (noteResult.length) {
        this.logger.log(`Deleted note (+ cascaded chunks): ${pageId}`);
        return;
      }

      const chunkResult = await dbClient
        .delete(chunk)
        .where(eq(chunk.id, pageId))
        .returning({ id: chunk.id });

      if (chunkResult.length) {
        this.logger.log(`Deleted chunk: ${pageId}`);
        return;
      }

      this.logger.warn(`No matching entity found for delete: ${pageId}`);
    } catch (err) {
      this.logger.error(`Error handling page.deleted for ${pageId}`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether a Notion page is a topic, note, or chunk.
   *
   * Fast path: look up existing DB rows by datasourceId.
   * Slow path: traverse the Notion parent chain via the API:
   *   Page → parent datasource/database → database → owner page
   *     - owner page is user.notionPageId  → page is a topic
   *     - owner page is in topic table     → page is a note
   *     - owner page is in note table      → page is a chunk
   */
  private async resolveEntityType(page: NotionPage): Promise<ResolvedEntity> {
    const parent = page.parent;
    let datasourceId = '';
    let databaseId = '';

    if (parent.type === 'data_source_id') {
      datasourceId = parent.data_source_id;
      databaseId = parent.database_id;
    } else if (parent.type === 'database_id') {
      databaseId = parent.database_id;
    } else {
      return {
        entityType: null,
        datasourceId: '',
        databaseId: '',
        userId: null,
        parentEntityId: null,
      };
    }

    // ----- Fast path: existing rows share the same datasourceId -----
    if (datasourceId) {
      const topicMatch = await dbClient
        .select({ userId: topic.userId, parentPageId: topic.parentPageId })
        .from(topic)
        .where(eq(topic.datasourceId, datasourceId))
        .limit(1);

      if (topicMatch.length) {
        return {
          entityType: 'topic',
          datasourceId,
          databaseId,
          userId: topicMatch[0].userId,
          parentEntityId: topicMatch[0].parentPageId,
        };
      }

      const noteMatch = await dbClient
        .select({ userId: note.userId, topicId: note.topicId })
        .from(note)
        .where(eq(note.datasourceId, datasourceId))
        .limit(1);

      if (noteMatch.length) {
        return {
          entityType: 'note',
          datasourceId,
          databaseId,
          userId: noteMatch[0].userId,
          parentEntityId: noteMatch[0].topicId,
        };
      }

      const chunkMatch = await dbClient
        .select({ userId: chunk.userId, noteId: chunk.noteId })
        .from(chunk)
        .where(eq(chunk.datasourceId, datasourceId))
        .limit(1);

      if (chunkMatch.length) {
        return {
          entityType: 'chunk',
          datasourceId,
          databaseId,
          userId: chunkMatch[0].userId,
          parentEntityId: chunkMatch[0].noteId,
        };
      }
    }

    // ----- Slow path: traverse Notion parent chain via API -----
    this.logger.log(
      `Fast path miss for datasourceId=${datasourceId}, traversing parent chain for database ${databaseId}`
    );

    try {
      const database = await this.notionClient.databases.retrieve({
        database_id: databaseId,
      });

      if (!isFullDatabase(database)) {
        this.logger.warn(`Database ${databaseId} is not a full database`);
        return {
          entityType: null,
          datasourceId,
          databaseId,
          userId: null,
          parentEntityId: null,
        };
      }

      // Extract the page that owns this database
      const dbParent = database.parent;
      let ownerPageId: string | null = null;

      if (dbParent.type === 'page_id') {
        ownerPageId = dbParent.page_id;
      } else if (dbParent.type === 'block_id') {
        ownerPageId = dbParent.block_id;
      }

      if (!ownerPageId) {
        this.logger.warn(
          `Database ${databaseId} has unexpected parent type: ${dbParent.type}`
        );
        return {
          entityType: null,
          datasourceId,
          databaseId,
          userId: null,
          parentEntityId: null,
        };
      }

      // Owner is the master page → new page is a topic
      const userMatch = await dbClient
        .select({ id: user.id })
        .from(user)
        .where(eq(user.notionPageId, ownerPageId))
        .limit(1);

      if (userMatch.length) {
        return {
          entityType: 'topic',
          datasourceId,
          databaseId,
          userId: userMatch[0].id,
          parentEntityId: ownerPageId,
        };
      }

      // Owner is a topic → new page is a note
      const topicMatch = await dbClient
        .select({ id: topic.id, userId: topic.userId })
        .from(topic)
        .where(eq(topic.id, ownerPageId))
        .limit(1);

      if (topicMatch.length) {
        return {
          entityType: 'note',
          datasourceId,
          databaseId,
          userId: topicMatch[0].userId,
          parentEntityId: topicMatch[0].id,
        };
      }

      // Owner is a note → new page is a chunk
      const noteMatch = await dbClient
        .select({ id: note.id, userId: note.userId })
        .from(note)
        .where(eq(note.id, ownerPageId))
        .limit(1);

      if (noteMatch.length) {
        return {
          entityType: 'chunk',
          datasourceId,
          databaseId,
          userId: noteMatch[0].userId,
          parentEntityId: noteMatch[0].id,
        };
      }

      this.logger.warn(
        `Owner page ${ownerPageId} of database ${databaseId} not found in any table`
      );
    } catch (err) {
      this.logger.error(
        `Error traversing parent chain for database ${databaseId}`,
        err
      );
    }

    return {
      entityType: null,
      datasourceId,
      databaseId,
      userId: null,
      parentEntityId: null,
    };
  }

  /**
   * Fetch page from Notion, resolve its entity type, and upsert into the DB.
   * Uses INSERT ... ON CONFLICT DO UPDATE so duplicate/rapid events are harmless.
   */
  private async upsertPage(pageId: string) {
    try {
      const page = (await this.notionClient.pages.retrieve({
        page_id: pageId,
      })) as unknown as NotionPage;

      const resolved = await this.resolveEntityType(page);

      if (!resolved.entityType || !resolved.userId) {
        this.logger.warn(`Could not resolve entity type for page ${pageId}`);
        return;
      }

      const name = page.properties.Name?.title[0]?.plain_text ?? '';
      const description =
        page.properties.Description?.rich_text[0]?.plain_text ?? '';

      switch (resolved.entityType) {
        case 'topic': {
          await dbClient
            .insert(topic)
            .values({
              id: pageId,
              parentPageId: resolved.parentEntityId,
              parentDatabaseId: resolved.databaseId,
              datasourceId: resolved.datasourceId,
              name,
              description,
              userId: resolved.userId,
            })
            .onConflictDoUpdate({
              target: topic.id,
              set: { name, description },
            });
          this.logger.log(`Upserted topic: ${pageId}`);
          break;
        }
        case 'note': {
          await dbClient
            .insert(note)
            .values({
              id: pageId,
              topicId: resolved.parentEntityId,
              parentDatabaseId: resolved.databaseId,
              datasourceId: resolved.datasourceId,
              name,
              description,
              userId: resolved.userId,
            })
            .onConflictDoUpdate({
              target: note.id,
              set: { name, description },
            });
          this.logger.log(`Upserted note: ${pageId}`);
          break;
        }
        case 'chunk': {
          const { contentJson, contentMd } =
            await this.fetchBlockChildrenWithMd(pageId);
          await dbClient
            .insert(chunk)
            .values({
              id: pageId,
              noteId: resolved.parentEntityId,
              parentDatabaseId: resolved.databaseId,
              datasourceId: resolved.datasourceId,
              name,
              description,
              contentJson,
              contentMd,
              userId: resolved.userId,
            })
            .onConflictDoUpdate({
              target: chunk.id,
              set: { name, description, contentJson, contentMd },
            });
          this.logger.log(`Upserted chunk: ${pageId}`);
          break;
        }
      }
    } catch (err) {
      this.logger.error(`Error upserting page ${pageId}`, err);
    }
  }

  private async fetchBlockChildrenWithMd(
    pageId: string
  ): Promise<{ contentJson: unknown; contentMd: string }> {
    const response = await this.notionClient.blocks.children.list({
      block_id: pageId,
    });
    const mdBlocks = await this.n2m.blocksToMarkdown(response.results);
    const mdString = this.n2m.toMarkdownString(mdBlocks);
    return {
      contentJson: response.results,
      contentMd: mdString.parent,
    };
  }
}
