import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

interface SerializedTextNode extends SerializedLexicalNode {
  type: 'text';
  text: string;
  format: number;
}

interface SerializedElementNode extends SerializedLexicalNode {
  type: string;
  children: SerializedLexicalNode[];
  tag?: string;
  listType?: string;
  language?: string;
}

// Lexical format flags
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_HIGHLIGHT = 1 << 7;

function serializeTextNode(node: SerializedTextNode): string {
  let text = node.text;
  if (!text) return '';

  const format = node.format;
  if (format & IS_CODE) text = `\`${text}\``;
  if (format & IS_BOLD) text = `**${text}**`;
  if (format & IS_ITALIC) text = `*${text}*`;
  if (format & IS_STRIKETHROUGH) text = `~~${text}~~`;
  if (format & IS_HIGHLIGHT) text = `==${text}==`;

  return text;
}

function serializeChildren(children: SerializedLexicalNode[]): string {
  return children
    .map((child) => {
      if (child.type === 'text') {
        return serializeTextNode(child as SerializedTextNode);
      }
      if (child.type === 'linebreak') {
        return '\n';
      }
      if ('children' in child) {
        return serializeNode(child as SerializedElementNode);
      }
      return '';
    })
    .join('');
}

function serializeNode(node: SerializedElementNode): string {
  const children = node.children ?? [];
  const inline = serializeChildren(children);

  switch (node.type) {
    case 'heading': {
      const tag = node.tag ?? 'h1';
      const level = parseInt(tag.replace('h', ''), 10) || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${inline}`;
    }
    case 'quote':
      return `> ${inline}`;
    case 'code': {
      const lang = node.language ?? '';
      const lines = children
        .filter((c) => c.type === 'code-highlight' || c.type === 'text' || c.type === 'linebreak')
        .map((c) => {
          if (c.type === 'linebreak') return '\n';
          return (c as SerializedTextNode).text ?? '';
        })
        .join('');
      return `\`\`\`${lang}\n${lines}\n\`\`\``;
    }
    case 'horizontalrule':
      return '---';
    case 'list': {
      const isOrdered = node.listType === 'number';
      return children
        .map((child, i) => {
          const content = serializeChildren(
            (child as SerializedElementNode).children ?? []
          );
          return isOrdered ? `${i + 1}. ${content}` : `- ${content}`;
        })
        .join('\n');
    }
    case 'listitem':
      return serializeChildren(children);
    case 'paragraph':
    default:
      return inline;
  }
}

export function lexicalToMarkdown(
  state: SerializedEditorState | undefined | null
): string {
  if (!state?.root?.children) return '';
  return (state.root.children as SerializedElementNode[])
    .map(serializeNode)
    .join('\n\n');
}

export function lexicalToPlainText(
  state: SerializedEditorState | undefined | null
): string {
  if (!state?.root?.children) return '';

  function extractText(nodes: SerializedLexicalNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'text') {
          return (node as SerializedTextNode).text;
        }
        if (node.type === 'linebreak') {
          return '\n';
        }
        if ('children' in node) {
          return extractText((node as SerializedElementNode).children ?? []);
        }
        return '';
      })
      .join('');
  }

  return (state.root.children as SerializedElementNode[])
    .map((node) => extractText(node.children ?? []))
    .join('\n')
    .trim();
}
