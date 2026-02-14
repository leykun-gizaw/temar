import { Injectable, Logger } from '@nestjs/common';
import { Client, isFullDatabase, isFullPage } from '@notionhq/client';
import { AppService } from '../app.service';
import { dbClient, user, topic, note, chunk } from '@temar/db-client';
import { eq } from 'drizzle-orm';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly appService: AppService) {}

  async handlePageCreated(
    entityId: string,
    workspaceId?: string
  ): Promise<void> {
    // Loop guard: skip if the page already exists in our DB
    const existsInDb = await this.entityExists(entityId);
    if (existsInDb) {
      this.logger.log(`Entity ${entityId} already exists in DB, skipping.`);
      return;
    }

    // Resolve the user from workspace_id so we can get their Notion client
    if (!workspaceId) {
      this.logger.warn(
        `No workspace_id in webhook for entity ${entityId}, skipping.`
      );
      return;
    }

    const userId = await this.getUserIdByWorkspace(workspaceId);
    if (!userId) {
      this.logger.warn(`No user found for workspace ${workspaceId}, skipping.`);
      return;
    }

    const client = await this.appService.getNotionClientForUser(userId);

    // Fetch the created page from Notion
    const page = await this.appService.getPage(client, entityId);
    if (!isFullPage(page)) {
      this.logger.warn(`Page ${entityId} is not a full page, skipping.`);
      return;
    }

    // Extract page properties
    const nameProperty = page.properties['Name'];
    const descProperty = page.properties['Description'];
    const name =
      nameProperty?.type === 'title'
        ? nameProperty.title[0]?.plain_text ?? ''
        : '';
    const description =
      descProperty?.type === 'rich_text'
        ? descProperty.rich_text[0]?.plain_text ?? ''
        : '';

    // Determine the parent database/datasource of the created page
    const parent = page.parent;
    let parentDatabaseId = '';
    let datasourceId = '';

    if (parent.type === 'data_source_id') {
      parentDatabaseId = parent.database_id;
      datasourceId = parent.data_source_id;
    } else if (parent.type === 'database_id') {
      parentDatabaseId = parent.database_id;
    } else {
      this.logger.log(
        `Page ${entityId} parent type is '${parent.type}', not a database page. Skipping.`
      );
      return;
    }

    // Get the parent database to find its parent page
    const database = await this.appService.getDatabase(
      client,
      parentDatabaseId
    );
    if (!isFullDatabase(database)) {
      this.logger.warn(
        `Database ${parentDatabaseId} is not a full database, skipping.`
      );
      return;
    }

    const dbParent = database.parent;
    let grandparentPageId: string | null = null;
    if (dbParent.type === 'page_id') {
      grandparentPageId = dbParent.page_id;
    } else if (dbParent.type === 'block_id') {
      grandparentPageId = dbParent.block_id;
    }

    if (!grandparentPageId) {
      this.logger.log(
        `Database ${parentDatabaseId} parent is not a page (type: ${dbParent.type}), skipping.`
      );
      return;
    }

    // Classify: is the grandparent page a master page, topic, or note?
    const classification = await this.classifyParentPage(grandparentPageId);

    if (!classification) {
      this.logger.log(
        `Grandparent page ${grandparentPageId} not found in any table, skipping.`
      );
      return;
    }

    this.logger.log(
      `Classified page ${entityId} as ${classification.type} (name: "${name}")`
    );

    switch (classification.type) {
      case 'topic':
        await this.handleNewTopic(
          client,
          entityId,
          name,
          description,
          parentDatabaseId,
          datasourceId,
          grandparentPageId,
          userId
        );
        break;
      case 'note':
        await this.handleNewNote(
          client,
          entityId,
          name,
          description,
          parentDatabaseId,
          datasourceId,
          classification.parentTopicId,
          userId
        );
        break;
      case 'chunk':
        await this.handleNewChunk(
          client,
          entityId,
          name,
          description,
          parentDatabaseId,
          datasourceId,
          classification.parentNoteId,
          userId
        );
        break;
    }
  }

  private async getUserIdByWorkspace(
    workspaceId: string
  ): Promise<string | null> {
    const [row] = await dbClient
      .select({ id: user.id })
      .from(user)
      .where(eq(user.notionWorkspaceId, workspaceId))
      .limit(1);
    return row?.id ?? null;
  }

  private async entityExists(id: string): Promise<boolean> {
    const [t] = await dbClient
      .select({ id: topic.id })
      .from(topic)
      .where(eq(topic.id, id))
      .limit(1);
    if (t) return true;

    const [n] = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(eq(note.id, id))
      .limit(1);
    if (n) return true;

    const [c] = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(eq(chunk.id, id))
      .limit(1);
    if (c) return true;

    return false;
  }

  private async classifyParentPage(
    pageId: string
  ): Promise<
    | { type: 'topic'; userId: string }
    | { type: 'note'; userId: string; parentTopicId: string }
    | { type: 'chunk'; userId: string; parentNoteId: string }
    | null
  > {
    // Check if it's the master page (user.notionPageId) → new page is a Topic
    const [masterUser] = await dbClient
      .select({ id: user.id })
      .from(user)
      .where(eq(user.notionPageId, pageId))
      .limit(1);
    if (masterUser) {
      return { type: 'topic', userId: masterUser.id };
    }

    // Check if it's a topic page → new page is a Note
    const [parentTopic] = await dbClient
      .select({ id: topic.id, userId: topic.userId })
      .from(topic)
      .where(eq(topic.id, pageId))
      .limit(1);
    if (parentTopic && parentTopic.userId) {
      return {
        type: 'note',
        userId: parentTopic.userId,
        parentTopicId: parentTopic.id,
      };
    }

    // Check if it's a note page → new page is a Chunk
    const [parentNote] = await dbClient
      .select({ id: note.id, userId: note.userId })
      .from(note)
      .where(eq(note.id, pageId))
      .limit(1);
    if (parentNote && parentNote.userId) {
      return {
        type: 'chunk',
        userId: parentNote.userId,
        parentNoteId: parentNote.id,
      };
    }

    return null;
  }

  private async handleNewTopic(
    client: Client,
    topicPageId: string,
    name: string,
    description: string,
    parentDatabaseId: string,
    datasourceId: string,
    masterPageId: string,
    userId: string
  ): Promise<void> {
    this.logger.log(`Creating cascade for new topic: ${topicPageId}`);

    // Create Notes database under the topic page
    const notesDatabase = await this.appService.createNotesPage(
      client,
      topicPageId
    );
    if (!isFullDatabase(notesDatabase) || !notesDatabase.data_sources?.length) {
      this.logger.error('Failed to create notes database for new topic');
      return;
    }

    // Create a sample note in the Notes database
    const notePage = await this.appService.createNote(
      client,
      notesDatabase.data_sources[0].id
    );
    if (!isFullPage(notePage)) {
      this.logger.error('Failed to create sample note for new topic');
      return;
    }

    // Create Chunks database under the note page
    const chunksDatabase = await this.appService.createChunksPage(
      client,
      notePage.id
    );
    if (
      !isFullDatabase(chunksDatabase) ||
      !chunksDatabase.data_sources?.length
    ) {
      this.logger.error('Failed to create chunks database for new topic');
      return;
    }

    // Create a sample chunk in the Chunks database
    const chunkPage = await this.appService.createChunk(
      client,
      chunksDatabase.data_sources[0].id
    );
    if (!isFullPage(chunkPage)) {
      this.logger.error('Failed to create sample chunk for new topic');
      return;
    }

    // Fetch chunk content
    const chunkContent = await this.appService.getBlockChildren(
      client,
      chunkPage.id
    );

    // Extract parent IDs for note and chunk
    const noteParent = notePage.parent;
    let noteParentDbId = '';
    let noteDatasourceId = '';
    if (noteParent.type === 'data_source_id') {
      noteParentDbId = noteParent.database_id;
      noteDatasourceId = noteParent.data_source_id;
    } else if (noteParent.type === 'database_id') {
      noteParentDbId = noteParent.database_id;
    }

    const chunkParent = chunkPage.parent;
    let chunkParentDbId = '';
    let chunkDatasourceId = '';
    if (chunkParent.type === 'data_source_id') {
      chunkParentDbId = chunkParent.database_id;
      chunkDatasourceId = chunkParent.data_source_id;
    } else if (chunkParent.type === 'database_id') {
      chunkParentDbId = chunkParent.database_id;
    }

    const noteName =
      notePage.properties['Name']?.type === 'title'
        ? notePage.properties['Name'].title[0]?.plain_text ?? ''
        : '';
    const noteDesc =
      notePage.properties['Description']?.type === 'rich_text'
        ? notePage.properties['Description'].rich_text[0]?.plain_text ?? ''
        : '';
    const chunkName =
      chunkPage.properties['Name']?.type === 'title'
        ? chunkPage.properties['Name'].title[0]?.plain_text ?? ''
        : '';
    const chunkDesc =
      chunkPage.properties['Description']?.type === 'rich_text'
        ? chunkPage.properties['Description'].rich_text[0]?.plain_text ?? ''
        : '';

    // Insert all three records in a transaction
    await dbClient.transaction(async (tx) => {
      await tx.insert(topic).values({
        id: topicPageId,
        parentPageId: masterPageId,
        parentDatabaseId,
        datasourceId,
        name,
        description,
        userId,
      });

      await tx.insert(note).values({
        id: notePage.id,
        topicId: topicPageId,
        parentDatabaseId: noteParentDbId,
        datasourceId: noteDatasourceId,
        name: noteName,
        description: noteDesc,
        userId,
      });

      await tx.insert(chunk).values({
        id: chunkPage.id,
        noteId: notePage.id,
        parentDatabaseId: chunkParentDbId,
        datasourceId: chunkDatasourceId,
        name: chunkName,
        description: chunkDesc,
        contentJson: chunkContent.results,
        userId,
      });
    });

    this.logger.log(
      `Topic cascade complete: topic=${topicPageId}, note=${notePage.id}, chunk=${chunkPage.id}`
    );
  }

  private async handleNewNote(
    client: Client,
    notePageId: string,
    name: string,
    description: string,
    parentDatabaseId: string,
    datasourceId: string,
    topicId: string,
    userId: string
  ): Promise<void> {
    this.logger.log(`Creating cascade for new note: ${notePageId}`);

    // Create Chunks database under the note page
    const chunksDatabase = await this.appService.createChunksPage(
      client,
      notePageId
    );
    if (
      !isFullDatabase(chunksDatabase) ||
      !chunksDatabase.data_sources?.length
    ) {
      this.logger.error('Failed to create chunks database for new note');
      return;
    }

    // Create a sample chunk
    const chunkPage = await this.appService.createChunk(
      client,
      chunksDatabase.data_sources[0].id
    );
    if (!isFullPage(chunkPage)) {
      this.logger.error('Failed to create sample chunk for new note');
      return;
    }

    // Fetch chunk content
    const chunkContent = await this.appService.getBlockChildren(
      client,
      chunkPage.id
    );

    // Extract parent IDs for chunk
    const chunkParent = chunkPage.parent;
    let chunkParentDbId = '';
    let chunkDatasourceId = '';
    if (chunkParent.type === 'data_source_id') {
      chunkParentDbId = chunkParent.database_id;
      chunkDatasourceId = chunkParent.data_source_id;
    } else if (chunkParent.type === 'database_id') {
      chunkParentDbId = chunkParent.database_id;
    }

    const chunkName =
      chunkPage.properties['Name']?.type === 'title'
        ? chunkPage.properties['Name'].title[0]?.plain_text ?? ''
        : '';
    const chunkDesc =
      chunkPage.properties['Description']?.type === 'rich_text'
        ? chunkPage.properties['Description'].rich_text[0]?.plain_text ?? ''
        : '';

    await dbClient.transaction(async (tx) => {
      await tx.insert(note).values({
        id: notePageId,
        topicId,
        parentDatabaseId,
        datasourceId,
        name,
        description,
        userId,
      });

      await tx.insert(chunk).values({
        id: chunkPage.id,
        noteId: notePageId,
        parentDatabaseId: chunkParentDbId,
        datasourceId: chunkDatasourceId,
        name: chunkName,
        description: chunkDesc,
        contentJson: chunkContent.results,
        userId,
      });
    });

    this.logger.log(
      `Note cascade complete: note=${notePageId}, chunk=${chunkPage.id}`
    );
  }

  private async handleNewChunk(
    client: Client,
    chunkPageId: string,
    name: string,
    description: string,
    parentDatabaseId: string,
    datasourceId: string,
    noteId: string,
    userId: string
  ): Promise<void> {
    this.logger.log(`Inserting new chunk: ${chunkPageId}`);

    // Fetch chunk content
    const chunkContent = await this.appService.getBlockChildren(
      client,
      chunkPageId
    );

    await dbClient.insert(chunk).values({
      id: chunkPageId,
      noteId,
      parentDatabaseId,
      datasourceId,
      name,
      description,
      contentJson: chunkContent.results,
      userId,
    });

    this.logger.log(`Chunk inserted: ${chunkPageId}`);
  }
}
