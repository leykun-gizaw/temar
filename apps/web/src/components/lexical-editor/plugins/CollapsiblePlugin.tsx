'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import {
  $createCollapsibleContainerNode,
  $createCollapsibleTitleNode,
  $createCollapsibleContentNode,
} from '../nodes/CollapsibleNodes';

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_COLLAPSIBLE_COMMAND'
);

export default function CollapsiblePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_COLLAPSIBLE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const title = $createCollapsibleTitleNode();
          title.append($createParagraphNode());

          const content = $createCollapsibleContentNode();
          content.append($createParagraphNode());

          const container = $createCollapsibleContainerNode(true);
          container.append(title);
          container.append(content);

          selection.insertNodes([container]);
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
