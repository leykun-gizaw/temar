'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';

export const INSERT_LINK_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_LINK_COMMAND'
);

export default function LinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_LINK_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const node = selection.anchor.getNode();
        const linkParent = $findMatchingParent(node, $isLinkNode);

        if (linkParent) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        } else {
          const url = prompt('Enter URL:');
          if (url) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          }
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
