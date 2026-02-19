import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  smallint,
  real,
  integer,
  timestamp,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { chunk } from './notion-cache-schema';

export const recallItem = pgTable('recall_item', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  chunkId: uuid('chunk_id')
    .notNull()
    .references(() => chunk.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  questionTitle: text('question_title'),
  questionText: text('question_text'),
  answerRubric: jsonb('answer_rubric'),
  state: smallint('state').notNull().default(0),
  due: timestamp('due', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  stability: real('stability').notNull().default(0),
  difficulty: real('difficulty').notNull().default(0),
  elapsedDays: integer('elapsed_days').notNull().default(0),
  scheduledDays: integer('scheduled_days').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  learningSteps: integer('learning_steps').notNull().default(0),
  lastReview: timestamp('last_review', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  generationBatchId: uuid('generation_batch_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
});

export const reviewLog = pgTable('review_log', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  recallItemId: uuid('recall_item_id')
    .notNull()
    .references(() => recallItem.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  rating: smallint('rating').notNull(),
  state: smallint('state').notNull(),
  due: timestamp('due', { withTimezone: true }).notNull(),
  stability: real('stability').notNull(),
  difficulty: real('difficulty').notNull(),
  elapsedDays: integer('elapsed_days').notNull(),
  scheduledDays: integer('scheduled_days').notNull(),
  durationMs: integer('duration_ms'),
  answerJson: jsonb('answer_json'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const chunkTrackingStatusEnum = pgEnum('chunk_tracking_status', [
  'pending',
  'generating',
  'ready',
  'failed',
]);

export const chunkTracking = pgTable(
  'chunk_tracking',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => chunk.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: chunkTrackingStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    unique('chunk_tracking_chunk_user_idx').on(table.chunkId, table.userId),
  ]
);
