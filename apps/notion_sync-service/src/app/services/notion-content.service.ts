import { Injectable, Logger } from '@nestjs/common';
import { Client, CreatePageResponse } from '@notionhq/client';
import { NotionApiService } from './notion-api.service';
import {
  toFullDatabase,
  toFullPage,
  firstDatasourceId,
  extractParentIds,
  extractPropertyText,
  type PageResponse,
} from '../helpers/notion-page.helpers';

export interface CascadeResult {
  topicPage: CreatePageResponse;
  notePage: CreatePageResponse;
  chunkPage: CreatePageResponse;
}

export interface NoteCascadeResult {
  notePage: CreatePageResponse;
  chunkPage: CreatePageResponse;
}

export interface ChunkResult {
  chunkPage: CreatePageResponse;
}

export interface EntityCreateOptions {
  datasourceId: string;
  name: string;
  description: string;
}

interface CreatedEntityInfo {
  page: CreatePageResponse;
  parentDatabaseId: string;
  datasourceId: string;
  name: string;
  description: string;
}

@Injectable()
export class NotionContentService {
  private readonly logger = new Logger(NotionContentService.name);

  constructor(private readonly notionApi: NotionApiService) {}

  async scaffoldMasterPage(
    client: Client,
    masterPageId: string
  ): Promise<CascadeResult> {
    await this.renameMasterPage(client, masterPageId);

    const topicDatasourceId = await this.createValidatedDatabase(
      client,
      masterPageId,
      '📚 Topics'
    );
    const topicPage = await this.createSampleTopic(client, topicDatasourceId);

    const noteDatasourceId = await this.createValidatedDatabase(
      client,
      topicPage.id,
      '📘 Notes'
    );
    const notePage = await this.createSampleNote(client, noteDatasourceId);

    const chunkDatasourceId = await this.createValidatedDatabase(
      client,
      notePage.id,
      '📄 Chunks'
    );
    const chunkPage = await this.createSampleChunk(client, chunkDatasourceId);

    return { topicPage, notePage, chunkPage };
  }

  async createTopicFromDatasource(
    client: Client,
    options: EntityCreateOptions
  ): Promise<CascadeResult> {
    const topicPage = await this.notionApi.createDatabasePage(client, {
      datasourceId: options.datasourceId,
      name: options.name,
      description: options.description,
      emoji: '📚',
    });

    const noteDatasourceId = await this.createValidatedDatabase(
      client,
      topicPage.id,
      '📘 Notes'
    );
    const notePage = await this.createSampleNote(client, noteDatasourceId);

    const chunkDatasourceId = await this.createValidatedDatabase(
      client,
      notePage.id,
      '📄 Chunks'
    );
    const chunkPage = await this.createSampleChunk(client, chunkDatasourceId);

    return { topicPage, notePage, chunkPage };
  }

  async createNoteFromDatasource(
    client: Client,
    options: EntityCreateOptions
  ): Promise<NoteCascadeResult> {
    const notePage = await this.notionApi.createDatabasePage(client, {
      datasourceId: options.datasourceId,
      name: options.name,
      description: options.description,
      emoji: '📘',
    });

    const chunkDatasourceId = await this.createValidatedDatabase(
      client,
      notePage.id,
      '📄 Chunks'
    );
    const chunkPage = await this.createSampleChunk(client, chunkDatasourceId);

    return { notePage, chunkPage };
  }

  async createChunkFromDatasource(
    client: Client,
    options: EntityCreateOptions
  ): Promise<ChunkResult> {
    const chunkPage = await this.notionApi.createDatabasePage(client, {
      datasourceId: options.datasourceId,
      name: options.name,
      description: options.description,
      emoji: '📄',
    });

    return { chunkPage };
  }

  async createNoteCascade(
    client: Client,
    parentPageId: string
  ): Promise<{ notePage: CreatedEntityInfo; chunkPage: CreatedEntityInfo }> {
    const noteDatasourceId = await this.createValidatedDatabase(
      client,
      parentPageId,
      '📘 Notes'
    );
    const notePage = await this.createSampleNote(client, noteDatasourceId);
    const noteInfo = await this.buildEntityInfo(notePage);

    const chunkDatasourceId = await this.createValidatedDatabase(
      client,
      notePage.id,
      '📄 Chunks'
    );
    const chunkPage = await this.createSampleChunk(client, chunkDatasourceId);
    const chunkInfo = await this.buildEntityInfo(chunkPage);

    return { notePage: noteInfo, chunkPage: chunkInfo };
  }

  async createChunkCascade(
    client: Client,
    parentPageId: string
  ): Promise<{ chunkPage: CreatedEntityInfo }> {
    const chunkDatasourceId = await this.createValidatedDatabase(
      client,
      parentPageId,
      '📄 Chunks'
    );
    const chunkPage = await this.createSampleChunk(client, chunkDatasourceId);
    const chunkInfo = await this.buildEntityInfo(chunkPage);

    return { chunkPage: chunkInfo };
  }

  async fetchBlockContent(client: Client, blockId: string) {
    return this.notionApi.listBlockChildren(client, blockId);
  }

  async createValidatedDatabase(
    client: Client,
    parentPageId: string,
    title: string
  ): Promise<string> {
    const database = await this.createChildDatabase(
      client,
      parentPageId,
      title
    );
    const fullDatabase = toFullDatabase(database);

    if (!fullDatabase) {
      throw new Error(
        `Failed to create database "${title}" under ${parentPageId}`
      );
    }

    const datasourceId = firstDatasourceId(fullDatabase);
    if (!datasourceId) {
      throw new Error(`Database "${title}" has no data sources`);
    }

    return datasourceId;
  }

  async buildEntityInfo(page: PageResponse): Promise<CreatedEntityInfo> {
    const fullPage = toFullPage(page);
    if (!fullPage) throw new Error('Expected a full page response');

    const parentIds = extractParentIds(fullPage);
    return {
      page: fullPage,
      parentDatabaseId: parentIds?.parentDatabaseId ?? '',
      datasourceId: parentIds?.datasourceId ?? '',
      name: extractPropertyText(fullPage, 'Name'),
      description: extractPropertyText(fullPage, 'Description'),
    };
  }

  private async renameMasterPage(client: Client, masterPageId: string) {
    await client.pages.update({
      page_id: masterPageId,
      properties: { title: { title: [{ text: { content: 'Temar' } }] } },
      icon: { emoji: '📖' },
    });
  }

  private async createChildDatabase(
    client: Client,
    parentPageId: string,
    headingTitle: string
  ) {
    await client.blocks.children.append({
      block_id: parentPageId,
      children: [
        {
          heading_1: {
            rich_text: [{ type: 'text', text: { content: headingTitle } }],
            color: 'blue_background',
          },
        },
      ],
    });
    return this.notionApi.createPageDatabase(
      client,
      parentPageId,
      headingTitle
    );
  }

  private async createSampleTopic(client: Client, datasourceId: string) {
    return this.notionApi.createDatabasePage(client, {
      datasourceId,
      name: 'Sample Topic',
      description: 'Sample topics demo description',
      emoji: '📚',
    });
  }

  private async createSampleNote(client: Client, datasourceId: string) {
    return this.notionApi.createDatabasePage(client, {
      datasourceId,
      name: 'Sample Note',
      description: 'Sample notes demo description',
      emoji: '📘',
    });
  }

  private async createSampleChunk(client: Client, datasourceId: string) {
    return this.notionApi.createDatabasePage(client, {
      datasourceId,
      name: 'Sample Chunk',
      description: 'Sample chunks demo description',
      emoji: '📄',
    });
  }
}
