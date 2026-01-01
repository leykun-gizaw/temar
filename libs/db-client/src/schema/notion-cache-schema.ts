import { jsonb } from 'drizzle-orm/pg-core';
import { text, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const topic = pgTable('topic', {
  id: uuid('id').primaryKey(),
  parentPageId: uuid('parent_page_id').references(() => user.notionPageId),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
});

export const note = pgTable('note', {
  id: uuid('id').primaryKey(),
  topicId: uuid('topic_id').references(() => topic.id),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
});

export const chunk = pgTable('chunk', {
  id: uuid().primaryKey(),
  noteId: uuid('note_id').references(() => note.id),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  contentJson: jsonb('content_json'),
  contentMd: text('content_markdown'),
});
