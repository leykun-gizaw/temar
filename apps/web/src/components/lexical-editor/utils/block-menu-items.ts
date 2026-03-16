import type { LexicalEditor } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_COLLAPSIBLE_COMMAND } from '../plugins/CollapsiblePlugin';

// Dialog commands - dispatched to open insert dialogs instead of using prompt()
export const OPEN_TABLE_DIALOG: LexicalCommand<void> =
  createCommand('OPEN_TABLE_DIALOG');
export const OPEN_IMAGE_DIALOG: LexicalCommand<void> =
  createCommand('OPEN_IMAGE_DIALOG');
export const OPEN_EQUATION_DIALOG: LexicalCommand<{ inline: boolean }> =
  createCommand('OPEN_EQUATION_DIALOG');
export const OPEN_MERMAID_DIALOG: LexicalCommand<void> =
  createCommand('OPEN_MERMAID_DIALOG');
export const OPEN_YOUTUBE_DIALOG: LexicalCommand<void> =
  createCommand('OPEN_YOUTUBE_DIALOG');
export const OPEN_LAYOUT_DIALOG: LexicalCommand<void> =
  createCommand('OPEN_LAYOUT_DIALOG');
export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<void> =
  createCommand('INSERT_PAGE_BREAK_COMMAND');

export interface BlockMenuItem {
  title: string;
  icon: string;
  description: string;
  keywords: string[];
  action: (editor: LexicalEditor) => void;
}

export function getBlockMenuItems(): BlockMenuItem[] {
  return [
    {
      title: 'Heading 1',
      icon: 'H1',
      description: 'Large heading',
      keywords: ['h1', 'heading', 'title'],
      action: (editor) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createHeadingNode('h1')]);
          }
        });
      },
    },
    {
      title: 'Heading 2',
      icon: 'H2',
      description: 'Medium heading',
      keywords: ['h2', 'heading', 'subtitle'],
      action: (editor) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createHeadingNode('h2')]);
          }
        });
      },
    },
    {
      title: 'Heading 3',
      icon: 'H3',
      description: 'Small heading',
      keywords: ['h3', 'heading'],
      action: (editor) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createHeadingNode('h3')]);
          }
        });
      },
    },
    {
      title: 'Bulleted List',
      icon: '•',
      description: 'Create a bulleted list',
      keywords: ['ul', 'unordered', 'bullet'],
      action: (editor) => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: 'Numbered List',
      icon: '1.',
      description: 'Create a numbered list',
      keywords: ['ol', 'ordered', 'number'],
      action: (editor) => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: 'Check List',
      icon: '☑',
      description: 'Create a check list',
      keywords: ['todo', 'check', 'task'],
      action: (editor) => {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      },
    },
    {
      title: 'Quote',
      icon: '"',
      description: 'Insert a blockquote',
      keywords: ['blockquote', 'quote'],
      action: (editor) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createQuoteNode()]);
          }
        });
      },
    },
    {
      title: 'Code Block',
      icon: '<>',
      description: 'Insert a code block',
      keywords: ['code', 'pre', 'block'],
      action: (editor) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createCodeNode()]);
          }
        });
      },
    },
    {
      title: 'Divider',
      icon: '—',
      description: 'Insert a horizontal rule',
      keywords: ['hr', 'divider', 'separator', 'line'],
      action: (editor) => {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
      },
    },
    {
      title: 'Table',
      icon: '⊞',
      description: 'Insert a table',
      keywords: ['table', 'grid', 'spreadsheet'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_TABLE_DIALOG, undefined);
      },
    },
    {
      title: 'Image',
      icon: '🖼',
      description: 'Insert an image from URL',
      keywords: ['image', 'photo', 'picture', 'img'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_IMAGE_DIALOG, undefined);
      },
    },
    {
      title: 'Equation (Block)',
      icon: 'Σ',
      description: 'Insert a block math equation',
      keywords: ['math', 'equation', 'latex', 'katex', 'formula'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_EQUATION_DIALOG, { inline: false });
      },
    },
    {
      title: 'Equation (Inline)',
      icon: 'x²',
      description: 'Insert an inline math equation',
      keywords: ['math', 'inline', 'equation', 'latex', 'katex'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_EQUATION_DIALOG, { inline: true });
      },
    },
    {
      title: 'Mermaid Diagram',
      icon: '◈',
      description: 'Insert a Mermaid diagram',
      keywords: [
        'mermaid',
        'diagram',
        'flowchart',
        'chart',
        'graph',
        'sequence',
      ],
      action: (editor) => {
        editor.dispatchCommand(OPEN_MERMAID_DIALOG, undefined);
      },
    },
    {
      title: 'YouTube Video',
      icon: '▶',
      description: 'Embed a YouTube video',
      keywords: ['youtube', 'video', 'embed'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_YOUTUBE_DIALOG, undefined);
      },
    },
    {
      title: 'Collapsible',
      icon: '▸',
      description: 'Insert a collapsible section',
      keywords: [
        'collapsible',
        'toggle',
        'details',
        'accordion',
        'expandable',
      ],
      action: (editor) => {
        editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
      },
    },
    {
      title: 'Page Break',
      icon: '⏎',
      description: 'Insert a page break',
      keywords: ['page', 'break', 'separator'],
      action: (editor) => {
        editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
      },
    },
    {
      title: 'Columns Layout',
      icon: '⫼',
      description: 'Insert a column layout',
      keywords: ['columns', 'layout', 'grid', 'side'],
      action: (editor) => {
        editor.dispatchCommand(OPEN_LAYOUT_DIALOG, undefined);
      },
    },
  ];
}
