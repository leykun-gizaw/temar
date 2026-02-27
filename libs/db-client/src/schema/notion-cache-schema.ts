import { jsonb, timestamp } from 'drizzle-orm/pg-core';
import { text, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const topic = pgTable('topic', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  parentPageId: uuid('parent_page_id').references(() => user.notionPageId),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at'),
});

export const note = pgTable('note', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  topicId: uuid('topic_id').references(() => topic.id, { onDelete: 'cascade' }),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at'),
});

export const chunk = pgTable('chunk', {
  id: uuid().primaryKey(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  noteId: uuid('note_id').references(() => note.id, { onDelete: 'cascade' }),
  parentDatabaseId: uuid('parent_database_id').notNull(),
  datasourceId: uuid('datasource_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  contentJson: jsonb('content_json'),
  contentMd: text('content_markdown'),
  contentUpdatedAt: timestamp('content_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at'),
});
