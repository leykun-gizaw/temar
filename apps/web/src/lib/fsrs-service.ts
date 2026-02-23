'use server';

export async function fsrsServiceFetch<T = unknown>(
  path: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    userId?: string;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const baseUrl = process.env.FSRS_SERVICE_API_ENDPOINT;
  const apiKey = process.env.FSRS_SERVICE_API_KEY;

  if (!baseUrl) throw new Error('FSRS_SERVICE_API_ENDPOINT not configured');

  const res = await fetch(`${baseUrl}/${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'x-api-key': apiKey }),
      ...(options?.userId && { 'x-user-id': options.userId }),
      ...options?.headers,
    },
    ...(options?.body && { body: JSON.stringify(options.body) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`FSRS service error ${res.status} on ${path}: ${text}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
