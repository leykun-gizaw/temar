'use server';

/**
 * Helper to call the Notion sync service API.
 * Handles base URL, API key header, and JSON parsing.
 */
export async function syncServiceFetch<T = unknown>(
  path: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
  }
): Promise<T> {
  const baseUrl = process.env.NOTION_SERVICE_API_ENDPOINT;
  const apiKey = process.env.NOTION_SYNC_API_KEY;

  if (!baseUrl) throw new Error('NOTION_SERVICE_API_ENDPOINT not configured');

  const res = await fetch(`${baseUrl}/${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'x-api-key': apiKey }),
    },
    ...(options?.body && { body: JSON.stringify(options.body) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sync service error ${res.status} on ${path}: ${text}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
