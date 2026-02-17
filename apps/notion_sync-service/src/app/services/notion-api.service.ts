import { Injectable } from '@nestjs/common';
import { Client, isFullBlock, isFullDatabase } from '@notionhq/client';

interface CreatePageOptions {
  datasourceId: string;
  name: string;
  description: string;
  emoji: string;
}

interface UpdatePropertiesOptions {
  name: string;
  description: string;
}

@Injectable()
export class NotionApiService {
  async retrievePage(client: Client, pageId: string) {
    return client.pages.retrieve({ page_id: pageId });
  }

  async retrieveBlock(client: Client, blockId: string) {
    return client.blocks.retrieve({ block_id: blockId });
  }

  async listBlockChildren(client: Client, blockId: string) {
    return client.blocks.children.list({ block_id: blockId });
  }

  async listBlockChildrenRecursive(client: Client, blockId: string) {
    const response = await client.blocks.children.list({ block_id: blockId });

    for (const block of response.results) {
      if (isFullBlock(block) && block.has_children) {
        const childResponse = await this.listBlockChildrenRecursive(
          client,
          block.id
        );
        (block as Record<string, unknown>)['children'] = childResponse.results;
      }
    }

    return response;
  }

  async appendBlockChildren(client: Client, blockId: string) {
    return client.blocks.children.append({
      block_id: blockId,
      children: [
        {
          heading_1: {
            rich_text: [{ text: { content: 'Hello, World 🌍' } }],
          },
        },
      ],
    });
  }

  async retrieveDatabase(client: Client, databaseId: string) {
    return client.databases.retrieve({ database_id: databaseId });
  }

  async createPageDatabase(
    client: Client,
    parentPageId: string,
    title: string
  ) {
    return client.databases.create({
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

  async createDatabasePage(client: Client, options: CreatePageOptions) {
    return client.pages.create({
      icon: { type: 'emoji', emoji: options.emoji },
      parent: {
        type: 'data_source_id',
        data_source_id: options.datasourceId,
      },
      properties: {
        Name: { title: [{ text: { content: options.name } }] },
        Description: {
          rich_text: [{ text: { content: options.description } }],
        },
      },
    });
  }

  async updatePageProperties(
    client: Client,
    pageId: string,
    options: UpdatePropertiesOptions
  ) {
    return client.pages.update({
      page_id: pageId,
      properties: {
        Name: { title: [{ text: { content: options.name } }] },
        Description: {
          rich_text: [{ text: { content: options.description } }],
        },
      },
    });
  }

  async archivePage(client: Client, pageId: string) {
    return client.pages.update({ page_id: pageId, archived: true });
  }

  async retrieveDataSource(client: Client, datasourceId: string) {
    return client.dataSources.retrieve({ data_source_id: datasourceId });
  }

  async queryDataSource(client: Client, datasourceId: string) {
    return client.dataSources.query({ data_source_id: datasourceId });
  }

  async listChildDatasourcePages(client: Client, pageId: string) {
    const children = await this.listBlockChildren(client, pageId);
    const childDatabase = children.results.find(
      (child) => isFullBlock(child) && child.type === 'child_database'
    );

    if (!childDatabase) return null;

    const database = await this.retrieveDatabase(client, childDatabase.id);
    if (!isFullDatabase(database)) return null;
    if (!database.data_sources?.length) return null;

    const datasourcePages = await this.queryDataSource(
      client,
      database.data_sources[0].id
    );
    return datasourcePages.results;
  }
}
