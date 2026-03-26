import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dedicated pool for SSE listener connections.
 * Each connected client holds one pg connection for LISTEN,
 * so this pool is kept separate from the main Drizzle pool.
 */
const ssePool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
  max: 20,
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const channel = `user_${userId.replace(/-/g, '_')}`;

  const client = await ssePool.connect();
  await client.query(`LISTEN "${channel}"`);

  const encoder = new TextEncoder();
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    client.query(`UNLISTEN "${channel}"`).catch(() => { /* noop */ });
    client.release();
  };

  const stream = new ReadableStream({
    start(controller) {
      // Keepalive comment every 30s to prevent proxy timeouts
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
          cleanup();
        }
      }, 30_000);

      const onNotification = (msg: { channel: string; payload?: string }) => {
        if (!msg.payload) return;
        try {
          const data = JSON.parse(msg.payload);
          const eventType: string = data.type ?? 'message';
          const formatted = `event: ${eventType}\ndata: ${msg.payload}\n\n`;
          controller.enqueue(encoder.encode(formatted));
        } catch {
          // Ignore malformed payloads
        }
      };

      client.on('notification', onNotification);

      // When the client disconnects the stream is cancelled
      const origCancel = controller.close.bind(controller);
      void origCancel; // keep reference for clarity
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Caddy / Nginx: disable response buffering
    },
  });
}
