import { dbClient } from './db-client';
import { sql } from 'drizzle-orm';

/**
 * Send a Postgres NOTIFY on a per-user channel.
 *
 * The payload must be JSON-serialisable and under ~7.5 kB
 * (Postgres NOTIFY payload limit is 8000 bytes).
 *
 * Listeners (e.g. the SSE endpoint in the web app) call
 * `LISTEN user_<userId>` to receive these events.
 */
export async function pgNotify(
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = `user_${userId.replace(/-/g, '_')}`;
  const data = JSON.stringify(payload);
  await dbClient.execute(sql`SELECT pg_notify(${channel}, ${data})`);
}
