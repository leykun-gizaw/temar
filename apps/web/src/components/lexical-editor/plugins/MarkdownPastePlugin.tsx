'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { ALL_TRANSFORMERS } from './MarkdownShortcutsPlugin';

/**
 * Heuristic score to detect whether text is markdown.
 * Returns a score >= 0; treat as markdown if score >= 2.
 */
function markdownScore(text: string): number {
  let score = 0;
  const lines = text.split('\n');
  const first50 = lines.slice(0, 50);

  for (const line of first50) {
    if (/^#{1,6}\s/.test(line)) score++;
    if (/^[-*+]\s/.test(line)) score++;
    if (/^\d+\.\s/.test(line)) score++;
    if (/^>\s/.test(line)) score++;
    if (/^```/.test(line)) score++;
    if (/^\|.*\|/.test(line)) score++;
    if (/^---+$/.test(line)) score++;
    if (/\*\*[^*]+\*\*/.test(line)) score++;
    if (/`[^`]+`/.test(line)) score++;
    if (/\[.+\]\(.+\)/.test(line)) score++;
    if (/!\[.*\]\(.+\)/.test(line)) score++;
    if (/\$\$/.test(line)) score++;
  }

  return score;
}

export default function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // If rich HTML is present (e.g. from Google Docs, Word), let default handler process it
        const html = clipboardData.getData('text/html');
        if (html && !html.includes('data-lexical')) {
          // Check if the HTML comes from a markdown renderer (simple heuristic)
          // If it has complex structure, let Lexical's HTML importer handle it
          const hasRichContent =
            /<(?:table|img|h[1-6]|pre|blockquote)\b/i.test(html);
          if (hasRichContent) return false;
        }

        const text = clipboardData.getData('text/plain');
        if (!text || text.length < 3) return false;

        const score = markdownScore(text);
        if (score < 2) return false;

        // Detected markdown — convert and insert
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.removeText();
          }
          $convertFromMarkdownString(text, ALL_TRANSFORMERS);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
