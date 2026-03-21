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
  type TextMatchTransformer,
  type Transformer,
} from '@lexical/markdown';
import { CodeNode, $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from '../nodes/ImageNode';
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '../nodes/EquationNode';
import {
  $createMermaidNode,
  $isMermaidNode,
  MermaidNode,
} from '../nodes/MermaidNode';

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

const MERMAID: ElementTransformer = {
  dependencies: [MermaidNode],
  export: (node) => {
    if ($isMermaidNode(node)) {
      return `\`\`\`mermaid\n${node.getCode()}\n\`\`\``;
    }
    return null;
  },
  regExp: /^```mermaid\s*$/,
  replace: (parentNode, _children, match, isImport) => {
    // Only handle during markdown import (paste), not during typing
    if (!isImport) return;
    const node = $createMermaidNode('');
    parentNode.replace(node);
  },
  type: 'element',
};

const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if ($isImageNode(node)) {
      return `![${node.getAltText()}](${node.getSrc()})`;
    }
    return null;
  },
  importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      src: src || '',
      altText: altText || '',
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

const BLOCK_EQUATION: ElementTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if ($isEquationNode(node) && !node.getInline()) {
      return `$$\n${node.getEquation()}\n$$`;
    }
    return null;
  },
  regExp: /^\$\$\s*$/,
  replace: (parentNode, _children, _match, isImport) => {
    if (!isImport) return;
    const node = $createEquationNode('', false);
    parentNode.replace(node);
  },
  type: 'element',
};

/**
 * Single-line code block shortcut: typing ``` (optionally followed by a
 * language name) immediately creates a CodeNode instead of waiting for a
 * closing ``` delimiter, which left residual backtick text in the editor.
 * The built-in CODE transformer is kept in the list only for
 * markdown import/export (paste & serialize).
 */
const CODE_SHORTCUT: ElementTransformer = {
  dependencies: [CodeNode],
  export: (node) => {
    if (!$isCodeNode(node)) return null;
    const textContent = node.getTextContent();
    return (
      '```' +
      (node.getLanguage() || '') +
      (textContent ? '\n' + textContent : '') +
      '\n```'
    );
  },
  regExp: /^```(\w+)?\s?$/,
  replace: (parentNode, _children, match) => {
    const codeNode = $createCodeNode(match[1] || undefined);
    parentNode.replace(codeNode);
    codeNode.selectEnd();
  },
  type: 'element',
};

const INLINE_EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if ($isEquationNode(node) && node.getInline()) {
      return `$${node.getEquation()}$`;
    }
    return null;
  },
  importRegExp: /\$([^$]+)\$/,
  regExp: /\$([^$]+)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const eqNode = $createEquationNode(equation || '', true);
    textNode.replace(eqNode);
  },
  trigger: '$',
  type: 'text-match',
};

export const ALL_TRANSFORMERS: Transformer[] = [
  HR,
  MERMAID,
  BLOCK_EQUATION,
  IMAGE,
  INLINE_EQUATION,
  HEADING,
  QUOTE,
  CODE_SHORTCUT,
  CODE, // multi-line import/export (paste & serialize)
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

export default function MarkdownShortcutsPlugin() {
  return <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />;
}
