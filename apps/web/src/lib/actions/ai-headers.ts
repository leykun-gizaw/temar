'use server';

import { getUserAiConfig, getAiSettings } from './ai-settings';
import { DEFAULT_MODEL_ID } from '@/lib/config/ai-operations';

/**
 * Build the AI-related headers for service-to-service calls.
 * Includes provider, model, BYOK flag, and (when BYOK is active) the
 * user's decrypted API key.
 */
export async function getAiHeaders(): Promise<Record<string, string>> {
  const config = await getUserAiConfig();
  const settings = await getAiSettings();
  const isByok = settings.useByok && settings.hasApiKey;
  // Use BYOK config provider first, then user's selected provider from settings
  const provider = config?.provider || settings.provider;
  return {
    ...(provider && { 'x-ai-provider': provider }),
    // Always send the pricing model ID so services can record usage correctly.
    // Falls back to DEFAULT_MODEL_ID when the user has no custom setting.
    'x-ai-model': config?.model || settings.model || DEFAULT_MODEL_ID,
    ...(config?.apiKey && { 'x-ai-api-key': config.apiKey }),
    'x-byok': isByok ? 'true' : 'false',
  };
}
