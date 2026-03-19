/**
 * Fetches available AI models from provider APIs.
 * Used by the seed script and admin sync action.
 */

export interface FetchedModel {
  id: string; // provider model ID (e.g. 'gemini-2.0-flash')
  provider: 'google' | 'anthropic' | 'deepseek';
  label: string;
}

// ---------------------------------------------------------------------------
// Google — Gemini models via generativelanguage API
// ---------------------------------------------------------------------------

interface GoogleModel {
  name: string; // e.g. 'models/gemini-2.0-flash'
  displayName: string;
  supportedGenerationMethods?: string[];
}

export async function fetchGoogleModels(
  apiKey: string
): Promise<FetchedModel[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google models API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { models: GoogleModel[] };

  return data.models
    .filter((m) =>
      m.supportedGenerationMethods?.includes('generateContent')
    )
    .filter((m) => {
      const id = m.name.replace('models/', '');
      // Skip non-text-generation models
      return (
        !id.startsWith('embedding-') &&
        !id.startsWith('text-embedding-') &&
        !id.startsWith('aqa') &&
        !id.includes('attribution') &&
        !id.startsWith('gemma-') && // local-only models
        !id.includes('-tts') &&
        !id.includes('robotics') &&
        !id.includes('image') &&
        !id.startsWith('nano-banana') // image generation models
      );
    })
    .map((m) => ({
      id: m.name.replace('models/', ''),
      provider: 'google' as const,
      label: m.displayName,
    }));
}

// ---------------------------------------------------------------------------
// Anthropic — Claude models
// ---------------------------------------------------------------------------

interface AnthropicModel {
  id: string; // e.g. 'claude-sonnet-4-20250514'
  display_name: string;
  type: string;
}

export async function fetchAnthropicModels(
  apiKey: string
): Promise<FetchedModel[]> {
  const models: FetchedModel[] = [];
  let hasMore = true;
  let afterId: string | undefined;

  while (hasMore) {
    const url = new URL('https://api.anthropic.com/v1/models');
    url.searchParams.set('limit', '100');
    if (afterId) url.searchParams.set('after_id', afterId);

    const res = await fetch(url.toString(), {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
    });
    if (!res.ok) {
      throw new Error(`Anthropic models API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      data: AnthropicModel[];
      has_more: boolean;
      last_id?: string;
    };

    for (const m of data.data) {
      models.push({
        id: m.id,
        provider: 'anthropic',
        label: m.display_name,
      });
    }

    hasMore = data.has_more;
    afterId = data.last_id;
  }

  return models;
}

// ---------------------------------------------------------------------------
// Deepseek — OpenAI-compatible /models endpoint
// ---------------------------------------------------------------------------

interface DeepseekModel {
  id: string; // e.g. 'deepseek-chat'
  object: string;
}

export async function fetchDeepseekModels(
  apiKey: string
): Promise<FetchedModel[]> {
  const res = await fetch('https://api.deepseek.com/models', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Deepseek models API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { data: DeepseekModel[] };

  return data.data.map((m) => ({
    id: m.id,
    provider: 'deepseek' as const,
    label: m.id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  }));
}

// ---------------------------------------------------------------------------
// Fetch all providers (skips providers whose API keys are missing)
// ---------------------------------------------------------------------------

export interface FetchAllOptions {
  googleApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
}

export async function fetchAllProviderModels(
  opts: FetchAllOptions
): Promise<{ models: FetchedModel[]; errors: string[] }> {
  const models: FetchedModel[] = [];
  const errors: string[] = [];

  const tasks: Array<{ name: string; fn: () => Promise<FetchedModel[]> }> = [];

  if (opts.googleApiKey) {
    tasks.push({
      name: 'Google',
      fn: () => fetchGoogleModels(opts.googleApiKey!),
    });
  }
  if (opts.anthropicApiKey) {
    tasks.push({
      name: 'Anthropic',
      fn: () => fetchAnthropicModels(opts.anthropicApiKey!),
    });
  }
  if (opts.deepseekApiKey) {
    tasks.push({
      name: 'Deepseek',
      fn: () => fetchDeepseekModels(opts.deepseekApiKey!),
    });
  }

  const results = await Promise.allSettled(tasks.map((t) => t.fn()));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      models.push(...result.value);
    } else {
      errors.push(`${tasks[i].name}: ${result.reason}`);
    }
  }

  return { models, errors };
}
