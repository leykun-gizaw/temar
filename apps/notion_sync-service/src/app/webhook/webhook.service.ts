import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { NotionAuthService } from '../services/notion-auth.service';
import { NotionApiService } from '../services/notion-api.service';
import { NotionContentService } from '../services/notion-content.service';
import { UserRepository } from '../services/user.repository';
import {
  extractParentIds,
  extractPropertyText,
  toFullPage,
  toFullDatabase,
  type PageCreatedContext,
} from '../helpers/notion-page.helpers';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly notionAuth: NotionAuthService,
    private readonly notionApi: NotionApiService,
    private readonly notionContent: NotionContentService,
    private readonly userRepository: UserRepository
  ) {}

  async handlePageCreated(
    entityId: string,
    workspaceId?: string
  ): Promise<void> {
    if (await this.userRepository.entityExistsInAnyTable(entityId)) {
      this.logger.log(`Entity ${entityId} already in DB, skipping.`);
      return;
    }

    const userId = await this.resolveUserId(entityId, workspaceId);
    if (!userId) return;

    const client = await this.notionAuth.resolveClient(userId);
    const context = await this.buildContext(client, entityId, userId);
    if (!context) return;

    await this.routeByClassification(client, context);
  }

  private async resolveUserId(
    entityId: string,
    workspaceId?: string
  ): Promise<string | null> {
    if (!workspaceId) {
      this.logger.warn(`No workspace_id for entity ${entityId}, skipping.`);
      return null;
    }

    const userId = await this.userRepository.findByWorkspaceId(workspaceId);
    if (!userId) {
      this.logger.warn(`No user for workspace ${workspaceId}, skipping.`);
    }
    return userId;
  }

  private async buildContext(
    client: Client,
    entityId: string,
    userId: string
  ): Promise<(PageCreatedContext & { grandparentPageId: string }) | null> {
    const page = toFullPage(
      await this.notionApi.retrievePage(client, entityId)
    );
    if (!page) {
      this.logger.warn(`Page ${entityId} is not a full page, skipping.`);
      return null;
    }

    const parentIds = extractParentIds(page);
    if (!parentIds) {
      this.logger.log(`Page ${entityId} parent is not a database, skipping.`);
      return null;
    }

    const grandparentPageId = await this.resolveGrandparentPageId(
      client,
      parentIds.parentDatabaseId
    );
    if (!grandparentPageId) return null;

    return {
      pageId: entityId,
      name: extractPropertyText(page, 'Name'),
      description: extractPropertyText(page, 'Description'),
      parentDatabaseId: parentIds.parentDatabaseId,
      datasourceId: parentIds.datasourceId,
      parentEntityId: grandparentPageId,
      userId,
      grandparentPageId,
    };
  }

  private async resolveGrandparentPageId(
    client: Client,
    parentDatabaseId: string
  ): Promise<string | null> {
    const database = toFullDatabase(
      await this.notionApi.retrieveDatabase(client, parentDatabaseId)
    );
    if (!database) {
      this.logger.warn(`Database ${parentDatabaseId} is not full, skipping.`);
      return null;
    }

    const { parent } = database;
    if (parent.type === 'page_id') return parent.page_id;
    if (parent.type === 'block_id') return parent.block_id;

    this.logger.log(
      `Database ${parentDatabaseId} parent type "${parent.type}" unsupported, skipping.`
    );
    return null;
  }

  private async routeByClassification(
    client: Client,
    context: PageCreatedContext & { grandparentPageId: string }
  ): Promise<void> {
    const classification = await this.userRepository.classifyParentPage(
      context.grandparentPageId
    );

    if (!classification) {
      this.logger.log(
        `Page ${context.grandparentPageId} not found in any table, skipping.`
      );
      return;
    }

    this.logger.log(
      `Classified ${context.pageId} as ${classification.type} ("${context.name}")`
    );

    switch (classification.type) {
      case 'topic':
        return this.handleNewTopic(client, context);
      case 'note':
        context.parentEntityId = classification.parentTopicId;
        return this.handleNewNote(client, context);
      case 'chunk':
        context.parentEntityId = classification.parentNoteId;
        return this.handleNewChunk(client, context);
    }
  }

  private async handleNewTopic(
    client: Client,
    context: PageCreatedContext
  ): Promise<void> {
    this.logger.log(`Creating cascade for new topic: ${context.pageId}`);

    const { notePage, chunkPage } = await this.notionContent.createNoteCascade(
      client,
      context.pageId
    );
    const chunkContent = await this.notionContent.fetchBlockContent(
      client,
      chunkPage.page.id
    );

    await this.userRepository.insertTopicWithCascade(
      {
        id: context.pageId,
        parentPageId: context.parentEntityId,
        parentDatabaseId: context.parentDatabaseId,
        datasourceId: context.datasourceId,
        name: context.name,
        description: context.description,
        userId: context.userId,
      },
      {
        id: notePage.page.id,
        topicId: context.pageId,
        parentDatabaseId: notePage.parentDatabaseId,
        datasourceId: notePage.datasourceId,
        name: notePage.name,
        description: notePage.description,
        userId: context.userId,
      },
      {
        id: chunkPage.page.id,
        noteId: notePage.page.id,
        parentDatabaseId: chunkPage.parentDatabaseId,
        datasourceId: chunkPage.datasourceId,
        name: chunkPage.name,
        description: chunkPage.description,
        contentJson: chunkContent.results,
        userId: context.userId,
      }
    );

    this.logger.log(
      `Topic cascade complete: topic=${context.pageId}, note=${notePage.page.id}, chunk=${chunkPage.page.id}`
    );
  }

  private async handleNewNote(
    client: Client,
    context: PageCreatedContext
  ): Promise<void> {
    this.logger.log(`Creating cascade for new note: ${context.pageId}`);

    const { chunkPage } = await this.notionContent.createChunkCascade(
      client,
      context.pageId
    );
    const chunkContent = await this.notionContent.fetchBlockContent(
      client,
      chunkPage.page.id
    );

    await this.userRepository.insertNoteWithChunk(
      {
        id: context.pageId,
        topicId: context.parentEntityId,
        parentDatabaseId: context.parentDatabaseId,
        datasourceId: context.datasourceId,
        name: context.name,
        description: context.description,
        userId: context.userId,
      },
      {
        id: chunkPage.page.id,
        noteId: context.pageId,
        parentDatabaseId: chunkPage.parentDatabaseId,
        datasourceId: chunkPage.datasourceId,
        name: chunkPage.name,
        description: chunkPage.description,
        contentJson: chunkContent.results,
        userId: context.userId,
      }
    );

    this.logger.log(
      `Note cascade complete: note=${context.pageId}, chunk=${chunkPage.page.id}`
    );
  }

  async handlePagePropertyUpdated(
    entityId: string,
    _workspaceId?: string
  ): Promise<void> {
    const entity = await this.userRepository.identifyEntity(entityId);
    if (!entity) {
      this.logger.log(
        `Entity ${entityId} not in DB, skipping property update.`
      );
      return;
    }

    const client = await this.notionAuth.resolveClient(entity.userId);
    const page = toFullPage(
      await this.notionApi.retrievePage(client, entityId)
    );
    if (!page) {
      this.logger.warn(`Page ${entityId} is not a full page, skipping.`);
      return;
    }

    const name = extractPropertyText(page, 'Name');
    const description = extractPropertyText(page, 'Description');

    await this.userRepository.updateEntityProperties(entityId, entity.type, {
      name,
      description,
    });

    this.logger.log(`Updated ${entity.type} ${entityId} properties: "${name}"`);
  }

  async handlePageContentUpdated(
    entityId: string,
    _workspaceId?: string
  ): Promise<void> {
    const entity = await this.userRepository.identifyEntity(entityId);
    if (!entity || entity.type !== 'chunk') {
      this.logger.log(
        `Entity ${entityId} is not a tracked chunk, skipping content update.`
      );
      return;
    }

    const client = await this.notionAuth.resolveClient(entity.userId);
    const children = await this.notionApi.listBlockChildrenRecursive(
      client,
      entityId
    );
    const contentMd = this.blocksToMarkdown(children.results);

    await this.userRepository.updateChunkContent(
      entityId,
      children.results,
      contentMd
    );

    this.logger.log(`Updated chunk ${entityId} content.`);
  }

  async handlePageDeleted(
    entityId: string,
    _workspaceId?: string
  ): Promise<void> {
    const entity = await this.userRepository.identifyEntity(entityId);
    if (!entity) {
      this.logger.log(`Entity ${entityId} not in DB, skipping deletion.`);
      return;
    }

    await this.userRepository.deleteEntity(entityId, entity.type);
    this.logger.log(`Deleted ${entity.type} ${entityId} from DB.`);
  }

  private blocksToMarkdown(blocks: unknown[], depth = 0): string {
    const indent = '  '.repeat(depth);

    return blocks
      .map((block) => {
        const b = block as Record<string, unknown>;
        const type = b['type'] as string | undefined;
        if (!type) return '';

        const children = b['children'] as unknown[] | undefined;
        const content = b[type] as
          | { rich_text?: Array<{ plain_text?: string }> }
          | undefined;
        const text =
          content?.rich_text?.map((rt) => rt.plain_text ?? '').join('') ?? '';

        if (type === 'column_list' || type === 'column') {
          return children?.length ? this.blocksToMarkdown(children, depth) : '';
        }

        let line = '';
        switch (type) {
          case 'heading_1':
            line = `# ${text}`;
            break;
          case 'heading_2':
            line = `## ${text}`;
            break;
          case 'heading_3':
            line = `### ${text}`;
            break;
          case 'bulleted_list_item':
            line = `${indent}- ${text}`;
            break;
          case 'numbered_list_item':
            line = `${indent}1. ${text}`;
            break;
          case 'to_do': {
            const checked = (b[type] as { checked?: boolean })?.checked;
            line = `${indent}- [${checked ? 'x' : ' '}] ${text}`;
            break;
          }
          case 'code':
            line = `\`\`\`\n${text}\n\`\`\``;
            break;
          case 'quote':
            line = `> ${text}`;
            break;
          case 'divider':
            line = '---';
            break;
          case 'table_of_contents':
            break;
          case 'image': {
            const img = b[type] as Record<string, unknown> | undefined;
            const imgType = img?.['type'] as string | undefined;
            const file = img?.['file'] as { url?: string } | undefined;
            const external = img?.['external'] as { url?: string } | undefined;
            const url = imgType === 'file' ? file?.url : external?.url;
            const caption = (
              img?.['caption'] as Array<{ plain_text?: string }> | undefined
            )
              ?.map((c) => c.plain_text ?? '')
              .join('');
            line = url ? `![${caption ?? ''}](${url})` : '';
            break;
          }
          default:
            line = text;
        }

        if (children?.length) {
          const childMd = this.blocksToMarkdown(children, depth + 1);
          return childMd ? (line ? `${line}\n\n${childMd}` : childMd) : line;
        }

        return line;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  private async handleNewChunk(
    client: Client,
    context: PageCreatedContext
  ): Promise<void> {
    this.logger.log(`Inserting new chunk: ${context.pageId}`);

    const chunkContent = await this.notionContent.fetchBlockContent(
      client,
      context.pageId
    );

    await this.userRepository.insertChunk({
      id: context.pageId,
      noteId: context.parentEntityId,
      parentDatabaseId: context.parentDatabaseId,
      datasourceId: context.datasourceId,
      name: context.name,
      description: context.description,
      contentJson: chunkContent.results,
      userId: context.userId,
    });

    this.logger.log(`Chunk inserted: ${context.pageId}`);
  }
}
