import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

/**
 * Convert a Lexical SerializedEditorState to a Markdown string.
 * Handles headings, paragraphs, lists, code blocks, horizontal rules,
 * and inline formatting (bold, italic, code, strikethrough).
 */
export function lexicalToMarkdown(state: SerializedEditorState): string {
  if (!state?.root?.children) return '';
  return state.root.children.map(nodeToMarkdown).join('\n');
}

function nodeToMarkdown(node: SerializedLexicalNode): string {
  const n = node as Record<string, unknown>;
  const children = (n.children as SerializedLexicalNode[] | undefined) ?? [];

  switch (n.type) {
    case 'heading': {
      const tag = (n.tag as string) ?? 'h1';
      const level = parseInt(tag.replace('h', ''), 10) || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${inlineChildren(children)}\n`;
    }

    case 'paragraph': {
      const text = inlineChildren(children);
      return `${text}\n`;
    }

    case 'list': {
      const listType = n.listType as string;
      return (
        children
          .map((child, i) => {
            const content = inlineChildren(
              ((child as Record<string, unknown>)
                .children as SerializedLexicalNode[]) ?? []
            );
            const prefix = listType === 'number' ? `${i + 1}.` : '-';
            return `${prefix} ${content}`;
          })
          .join('\n') + '\n'
      );
    }

    case 'listitem': {
      return inlineChildren(children);
    }

    case 'code': {
      const language = (n.language as string) ?? '';
      const codeText = children
        .map((c) => {
          const cn = c as Record<string, unknown>;
          return (cn.text as string) ?? '';
        })
        .join('\n');
      return `\`\`\`${language}\n${codeText}\n\`\`\`\n`;
    }

    case 'horizontalrule': {
      return '---\n';
    }

    case 'quote': {
      const text = inlineChildren(children);
      return (
        text
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n'
      );
    }

    case 'table': {
      const rows = children.map((row) => {
        const cells =
          ((row as Record<string, unknown>)
            .children as SerializedLexicalNode[]) ?? [];
        return (
          '| ' +
          cells
            .map((cell) => {
              const cellChildren =
                ((cell as Record<string, unknown>)
                  .children as SerializedLexicalNode[]) ?? [];
              return cellChildren.map(nodeToMarkdown).join('').trim();
            })
            .join(' | ') +
          ' |'
        );
      });
      if (rows.length > 0) {
        const firstRow =
          ((children[0] as Record<string, unknown>)
            .children as SerializedLexicalNode[]) ?? [];
        const separator = '| ' + firstRow.map(() => '---').join(' | ') + ' |';
        return [rows[0], separator, ...rows.slice(1)].join('\n') + '\n';
      }
      return '';
    }

    case 'image': {
      const src = (n.src as string) ?? '';
      const alt = (n.altText as string) ?? '';
      return `![${alt}](${src})\n`;
    }

    case 'equation': {
      const equation = (n.equation as string) ?? '';
      const inline = (n.inline as boolean) ?? false;
      if (inline) return `$${equation}$`;
      return `$$\n${equation}\n$$\n`;
    }

    case 'mermaid': {
      const code = (n.code as string) ?? '';
      return `\`\`\`mermaid\n${code}\n\`\`\`\n`;
    }

    case 'youtube': {
      const videoID = (n.videoID as string) ?? '';
      return `[YouTube](https://www.youtube.com/watch?v=${videoID})\n`;
    }

    case 'collapsible-container': {
      return children.map(nodeToMarkdown).join('\n');
    }

    case 'collapsible-title': {
      const text = inlineChildren(children);
      return `<details><summary>${text}</summary>\n`;
    }

    case 'collapsible-content': {
      const content = children.map(nodeToMarkdown).join('\n');
      return `${content}\n</details>\n`;
    }

    case 'page-break': {
      return '<!-- pagebreak -->\n';
    }

    case 'layout-container': {
      // Flatten layout columns into sequential content
      return children.map(nodeToMarkdown).join('\n');
    }

    case 'layout-item': {
      return children.map(nodeToMarkdown).join('\n');
    }

    default:
      if (children.length > 0) {
        return children.map(nodeToMarkdown).join('\n');
      }
      return '';
  }
}

function inlineChildren(children: SerializedLexicalNode[]): string {
  return children.map(inlineNode).join('');
}

function inlineNode(node: SerializedLexicalNode): string {
  const n = node as Record<string, unknown>;

  if (n.type === 'text') {
    let text = (n.text as string) ?? '';
    const format = (n.format as number) ?? 0;

    // Lexical format flags: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code, 32=subscript, 64=superscript, 128=highlight
    if (format & 16) text = `\`${text}\``;
    if (format & 1) text = `**${text}**`;
    if (format & 2) text = `*${text}*`;
    if (format & 4) text = `~~${text}~~`;
    if (format & 128) text = `==${text}==`;

    return text;
  }

  if (n.type === 'linebreak') {
    return '\n';
  }

  if (n.type === 'link') {
    const url = (n.url as string) ?? '';
    const children = (n.children as SerializedLexicalNode[]) ?? [];
    const text = inlineChildren(children);
    return `[${text}](${url})`;
  }

  // Fallback for unknown inline types
  const children = (n.children as SerializedLexicalNode[]) ?? [];
  if (children.length > 0) {
    return inlineChildren(children);
  }

  return (n.text as string) ?? '';
}

/**
 * Convert a Lexical SerializedEditorState to plain text.
 * Strips all formatting and returns raw text content.
 */
export function lexicalToPlainText(state: SerializedEditorState): string {
  if (!state?.root?.children) return '';
  return state.root.children.map(nodeToPlainText).join('\n').trim();
}

function nodeToPlainText(node: SerializedLexicalNode): string {
  const n = node as Record<string, unknown>;
  const children = (n.children as SerializedLexicalNode[] | undefined) ?? [];

  if (n.type === 'text') {
    return (n.text as string) ?? '';
  }

  if (n.type === 'linebreak') {
    return '\n';
  }

  if (n.type === 'horizontalrule') {
    return '';
  }

  if (n.type === 'image') {
    return (n.altText as string) ?? '';
  }

  if (n.type === 'equation') {
    return (n.equation as string) ?? '';
  }

  if (n.type === 'mermaid') {
    return (n.code as string) ?? '';
  }

  if (n.type === 'youtube') {
    return `https://www.youtube.com/watch?v=${(n.videoID as string) ?? ''}`;
  }

  if (n.type === 'page-break') {
    return '\n';
  }

  const childText = children.map(nodeToPlainText).join('');

  switch (n.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
      return `${childText}\n`;
    case 'listitem':
      return `${childText}\n`;
    case 'list':
      return childText;
    case 'table':
    case 'tablerow':
    case 'tablecell':
    case 'collapsible-container':
    case 'collapsible-title':
    case 'collapsible-content':
    case 'layout-container':
    case 'layout-item':
      return `${childText}\n`;
    default:
      return childText;
  }
}
