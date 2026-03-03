/**
 * Converts a Plate.js editor JSON value to markdown string.
 * Handles basic nodes (paragraphs, headings, blockquote, hr),
 * inline marks (bold, italic, underline, strikethrough, code, highlight),
 * and code blocks.
 */

interface PlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  highlight?: boolean;
}

interface PlateNode {
  type?: string;
  children?: (PlateNode | PlateText)[];
  text?: string;
  lang?: string;
  [key: string]: unknown;
}

function isTextNode(node: PlateNode | PlateText): node is PlateText {
  return 'text' in node && typeof node.text === 'string' && !('type' in node);
}

function serializeInline(node: PlateNode | PlateText): string {
  if (isTextNode(node)) {
    let text = node.text;
    if (!text) return '';
    if (node.code) text = `\`${text}\``;
    if (node.bold) text = `**${text}**`;
    if (node.italic) text = `*${text}*`;
    if (node.strikethrough) text = `~~${text}~~`;
    if (node.highlight) text = `==${text}==`;
    return text;
  }

  if (node.children) {
    return node.children.map(serializeInline).join('');
  }

  return '';
}

function serializeNode(node: PlateNode): string {
  const children = node.children ?? [];
  const inline = children.map(serializeInline).join('');

  switch (node.type) {
    case 'h1':
      return `# ${inline}`;
    case 'h2':
      return `## ${inline}`;
    case 'h3':
      return `### ${inline}`;
    case 'h4':
      return `#### ${inline}`;
    case 'h5':
      return `##### ${inline}`;
    case 'h6':
      return `###### ${inline}`;
    case 'blockquote':
      return `> ${inline}`;
    case 'hr':
      return '---';
    case 'code_block': {
      const lang = (node.lang as string) ?? '';
      const lines = children
        .filter((c): c is PlateNode => 'type' in c && c.type === 'code_line')
        .map((line) =>
          (line.children ?? []).map(serializeInline).join('')
        );
      return `\`\`\`${lang}\n${lines.join('\n')}\n\`\`\``;
    }
    case 'code_line':
      return inline;
    case 'p':
    default:
      return inline;
  }
}

export function plateValueToMarkdown(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return (value as PlateNode[])
    .map(serializeNode)
    .join('\n\n');
}
