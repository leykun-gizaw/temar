import { isFullDatabase, isFullPage } from '@notionhq/client';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  DatabaseObjectResponse,
  PartialDatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

export type PageResponse = PageObjectResponse | PartialPageObjectResponse;
export type DatabaseResponse =
  | DatabaseObjectResponse
  | PartialDatabaseObjectResponse;

export interface PageParentIds {
  parentDatabaseId: string;
  datasourceId: string;
}

export interface PageCreatedContext {
  pageId: string;
  name: string;
  description: string;
  parentDatabaseId: string;
  datasourceId: string;
  parentEntityId: string;
  userId: string;
}

export function extractParentIds(
  page: PageObjectResponse
): PageParentIds | null {
  const { parent } = page;

  if (parent.type === 'data_source_id') {
    return {
      parentDatabaseId: parent.database_id,
      datasourceId: parent.data_source_id,
    };
  }

  if (parent.type === 'database_id') {
    return { parentDatabaseId: parent.database_id, datasourceId: '' };
  }

  return null;
}

export function extractPropertyText(
  page: PageObjectResponse,
  propertyName: string
): string {
  const property = page.properties[propertyName];
  if (!property) return '';

  if (property.type === 'title') {
    return property.title[0]?.plain_text ?? '';
  }

  if (property.type === 'rich_text') {
    return property.rich_text[0]?.plain_text ?? '';
  }

  return '';
}

export function firstDatasourceId(
  database: DatabaseObjectResponse
): string | null {
  if (!database.data_sources?.length) return null;
  return database.data_sources[0].id;
}

export function toFullPage(page: PageResponse): PageObjectResponse | null {
  return isFullPage(page) ? page : null;
}

export function toFullDatabase(
  database: DatabaseResponse
): DatabaseObjectResponse | null {
  return isFullDatabase(database) ? database : null;
}
