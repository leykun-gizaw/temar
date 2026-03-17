'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical';
import {
  $createLayoutContainerNode,
  $createLayoutItemNode,
} from '../nodes/LayoutNodes';

export function insertLayout(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  templateColumns: string,
  columnCount: number
) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const container = $createLayoutContainerNode(templateColumns);
    for (let i = 0; i < columnCount; i++) {
      const item = $createLayoutItemNode();
      item.append($createParagraphNode());
      container.append(item);
    }
    selection.insertNodes([container, $createParagraphNode()]);
  });
}

export default function LayoutPlugin() {
  return null;
}
