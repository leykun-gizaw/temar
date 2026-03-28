import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'https://api.pricepertoken.com/mcp/mcp';

async function createClient(): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const c = new Client({ name: 'temar-admin', version: '1.0.0' }, {});
  await c.connect(transport);
  return c;
}

export interface PricePerTokenModel {
  slug: string;
  author_name: string;
  model_name: string;
  input_per_1m: number | null;
  output_per_1m: number | null;
  context_length: number;
  supports_vision: boolean;
  supports_reasoning: boolean;
}

export async function fetchProviderPricing(
  author: 'google' | 'anthropic' | 'deepseek'
): Promise<PricePerTokenModel[]> {
  const c = await createClient();
  try {
    const result = await c.callTool({
      name: 'get_all_models',
      arguments: { author, limit: 100 },
    });

    const textBlock = (
      result.content as Array<{ type: string; text?: string }>
    ).find((b) => b.type === 'text');
    if (!textBlock?.text) return [];

    let parsed: unknown;
    try {
      const outer = JSON.parse(textBlock.text);
      parsed =
        typeof outer === 'object' && outer !== null && 'result' in outer
          ? JSON.parse((outer as { result: string }).result)
          : outer;
    } catch {
      parsed = JSON.parse(textBlock.text);
    }

    const models = parsed as PricePerTokenModel[];
    return models.filter(
      (m) => m.input_per_1m != null && m.output_per_1m != null
    );
  } finally {
    await c.close();
  }
}

export async function fetchAllProviderPricing() {
  const [google, anthropic, deepseek] = await Promise.allSettled([
    fetchProviderPricing('google'),
    fetchProviderPricing('anthropic'),
    fetchProviderPricing('deepseek'),
  ]);

  return {
    models: [
      ...(google.status === 'fulfilled' ? google.value : []),
      ...(anthropic.status === 'fulfilled' ? anthropic.value : []),
      ...(deepseek.status === 'fulfilled' ? deepseek.value : []),
    ],
    errors: [
      google.status === 'rejected' ? `Google: ${google.reason}` : null,
      anthropic.status === 'rejected'
        ? `Anthropic: ${anthropic.reason}`
        : null,
      deepseek.status === 'rejected'
        ? `Deepseek: ${deepseek.reason}`
        : null,
    ].filter(Boolean) as string[],
  };
}

/** Strip provider prefix from slug to get Temar model ID. */
export function slugToModelId(slug: string, authorName: string): string {
  const prefix = authorName.toLowerCase() + '-';
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

/** Map pricepertoken author_name to Temar AiProvider. */
export function authorToProvider(
  authorName: string
): 'google' | 'anthropic' | 'deepseek' {
  const lower = authorName.toLowerCase();
  if (lower === 'anthropic') return 'anthropic';
  if (lower === 'deepseek') return 'deepseek';
  return 'google';
}
