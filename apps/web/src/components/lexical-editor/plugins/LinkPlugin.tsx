'use client';

import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Simplified LinkPlugin that delegates to Lexical's built-in LinkPlugin.
 * Link editing is now handled by FloatingLinkEditorPlugin.
 */
export default function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}
