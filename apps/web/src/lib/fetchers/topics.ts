'use server';

import type { Topic } from '@/lib/zod/topic-schema';

// In-memory topics store for demo/dev. In real apps, replace with DB access.
const topics_data: Topic[] = [
  // {
  //   id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef23',
  //   title: 'React',
  //   slug: 'react',
  //   description:
  //     'A deep dive into the React library for building user interfaces.',
  //   createdAt: '2025-08-07T09:10:05.000Z',
  //   updatedAt: '2025-08-07T09:10:05.000Z',
  //   userId: '323e4567-e89b-12d3-a456-426614174002',
  // },
  // {
  //   id: 'd4e5f6a7-b8c9-0123-4567-890abcdef234',
  //   title: 'Data Structures & Algorithms',
  //   slug: 'data-structures-algorithms',
  //   description: 'An introduction to common data structures and algorithms.',
  //   createdAt: '2025-08-07T09:15:00.000Z',
  //   updatedAt: '2025-08-07T09:15:00.000Z',
  //   userId: '423e4567-e89b-12d3-a456-426614174003',
  // },
  // {
  //   id: 'e5f6a7b8-c9d0-1234-5678-90abcdef2345',
  //   title: 'Machine Learning',
  //   slug: 'machine-learning',
  //   description: 'An overview of machine learning concepts and techniques.',
  //   createdAt: '2025-08-07T09:20:00.000Z',
  //   updatedAt: '2025-08-07T09:20:00.000Z',
  //   userId: '523e4567-e89b-12d3-a456-426614174004',
  // },
  // ...remaining seeded topics...
];

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
