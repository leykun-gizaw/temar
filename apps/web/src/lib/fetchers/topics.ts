'use server';

import type { Topic } from '@/lib/zod/topic-schema';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function getFilteredDBTopics(pageId: string, query: string) {
  const notionServiceApiEndpoint = process.env.NOTION_SERVICE_API_ENDPOINT;

  const response = await fetch(
    `${notionServiceApiEndpoint}/page/${pageId}/get_datasource_list`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch topics from Notion service');
  }
  const data = await response.json();

  const filteredData = data.filter((topic: PageObjectResponse) =>
    topic.properties.Name.title[0].plain_text
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return filteredData;
}
