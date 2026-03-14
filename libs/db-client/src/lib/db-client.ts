import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
});

export const dbClient = drizzle({ client: pool });

export type DbClient = NodePgDatabase;

/**
 * Execute a callback inside a Postgres transaction.
 * If the callback throws, the transaction is rolled back.
 */
export async function withTransaction<T>(
  fn: (tx: DbClient) => Promise<T>
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dbClient.transaction(fn as any) as Promise<T>;
}
