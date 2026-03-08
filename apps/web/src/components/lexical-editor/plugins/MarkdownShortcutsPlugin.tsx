'use client';

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  LINK,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  HIGHLIGHT,
  type ElementTransformer,
} from '@lexical/markdown';
import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';

const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    if ($isHorizontalRuleNode(node)) {
      return '---';
    }
    return null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode) => {
    const node = $createHorizontalRuleNode();
    parentNode.replace(node);
  },
  type: 'element',
};

const ALL_TRANSFORMERS = [
  HR,
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  LINK,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  HIGHLIGHT,
];

export { ALL_TRANSFORMERS };

export default function MarkdownShortcutsPlugin() {
  return <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />;
}
