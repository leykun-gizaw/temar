'use server';

import type { Topic } from '@/lib/zod/topic-schema';

export async function getFilteredDBTopics(pageId: string, query: string) {
  const notionServiceApiEndpoint = process.env.NOTION_SERVICE_API_ENDPOINT;

  const response = await fetch(
    `${notionServiceApiEndpoint}/page/${pageId}/get_datasource_list`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch topics from Notion service');
  }
  const data = await response.json();

  const filteredData = data.filter((topic: Topic) =>
    topic.properties.Name.title[0].plain_text
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return filteredData;
}

export async function getAllTopics() {
  return Promise.resolve(topics_data);
}

export async function getFilteredTopics(query: string) {
  const filteredTopics = topics_data.filter((topic) =>
    topic.title.includes(query)
  );
  return Promise.resolve(filteredTopics);
}

export async function getTopicById(id: string) {
  return topics_data.find((t) => String(t.id) === String(id)) ?? null;
}
