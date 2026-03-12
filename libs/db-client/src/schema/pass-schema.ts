import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const passBalance = pgTable(
  'pass_balance',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    balance: integer('balance').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index('pass_balance_userId_idx').on(table.userId)]
);

export const passTransaction = pgTable(
  'pass_transaction',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    operationType: text('operation_type').notNull(),
    description: text('description').notNull(),
    paddleTransactionId: text('paddle_transaction_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index('pass_transaction_userId_idx').on(table.userId)]
);
