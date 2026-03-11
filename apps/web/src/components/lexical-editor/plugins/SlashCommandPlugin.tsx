'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
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
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { $createImageNode } from '../nodes/ImageNode';
import { $createEquationNode } from '../nodes/EquationNode';
import { $createMermaidNode } from '../nodes/MermaidNode';
import { $createYouTubeNode } from '../nodes/YouTubeNode';
import { INSERT_COLLAPSIBLE_COMMAND } from './CollapsiblePlugin';

interface SlashMenuItem {
  title: string;
  icon: string;
  description: string;
  keywords: string[];
  action: () => void;
}

export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<SlashMenuItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const getMenuItems = useCallback((): SlashMenuItem[] => {
    return [
      {
        title: 'Heading 1',
        icon: 'H1',
        description: 'Large heading',
        keywords: ['h1', 'heading', 'title'],
        action: () => {
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
        action: () => {
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
        action: () => {
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
        action: () => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        title: 'Numbered List',
        icon: '1.',
        description: 'Create a numbered list',
        keywords: ['ol', 'ordered', 'number'],
        action: () => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        title: 'Check List',
        icon: '☑',
        description: 'Create a check list',
        keywords: ['todo', 'check', 'task'],
        action: () => {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        },
      },
      {
        title: 'Quote',
        icon: '"',
        description: 'Insert a blockquote',
        keywords: ['blockquote', 'quote'],
        action: () => {
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
        action: () => {
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
        action: () => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        },
      },
      {
        title: 'Table',
        icon: '⊞',
        description: 'Insert a table',
        keywords: ['table', 'grid', 'spreadsheet'],
        action: () => {
          const rows = prompt('Number of rows:', '3');
          const cols = prompt('Number of columns:', '3');
          if (rows && cols) {
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              rows,
              columns: cols,
              includeHeaders: true,
            });
          }
        },
      },
      {
        title: 'Image',
        icon: '🖼',
        description: 'Insert an image from URL',
        keywords: ['image', 'photo', 'picture', 'img'],
        action: () => {
          const src = prompt('Image URL:');
          if (src) {
            const alt = prompt('Alt text (optional):', '') || '';
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes([
                  $createImageNode({ src, altText: alt }),
                ]);
              }
            });
          }
        },
      },
      {
        title: 'Equation (Block)',
        icon: 'Σ',
        description: 'Insert a block math equation',
        keywords: ['math', 'equation', 'latex', 'katex', 'formula'],
        action: () => {
          const equation = prompt('LaTeX equation:', 'E = mc^2');
          if (equation) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes([
                  $createEquationNode(equation, false),
                  $createParagraphNode(),
                ]);
              }
            });
          }
        },
      },
      {
        title: 'Equation (Inline)',
        icon: 'x²',
        description: 'Insert an inline math equation',
        keywords: ['math', 'inline', 'equation', 'latex', 'katex'],
        action: () => {
          const equation = prompt('Inline LaTeX equation:', 'x^2');
          if (equation) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes([$createEquationNode(equation, true)]);
              }
            });
          }
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
        action: () => {
          const code = prompt(
            'Mermaid diagram code:',
            'graph TD\n    A[Start] --> B[End]'
          );
          if (code) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes([
                  $createMermaidNode(code),
                  $createParagraphNode(),
                ]);
              }
            });
          }
        },
      },
      {
        title: 'YouTube Video',
        icon: '▶',
        description: 'Embed a YouTube video',
        keywords: ['youtube', 'video', 'embed'],
        action: () => {
          const url = prompt('YouTube URL or video ID:');
          if (url) {
            let videoID = url;
            const match = url.match(
              /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );
            if (match) videoID = match[1];
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes([
                  $createYouTubeNode(videoID),
                  $createParagraphNode(),
                ]);
              }
            });
          }
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
        action: () => {
          editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
        },
      },
    ];
  }, [editor]);

  useEffect(() => {
    const removeListener = editor.registerTextContentListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setShowMenu(false);
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const textContent = anchorNode.getTextContent();

        if (textContent === '/') {
          const items = getMenuItems();
          setMenuItems(items);
          setSelectedIndex(0);
          setShowMenu(true);

          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + 4, left: rect.left });
          }
        } else if (textContent.startsWith('/') && textContent.length > 1) {
          const query = textContent.slice(1).toLowerCase();
          const items = getMenuItems().filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query) ||
              item.keywords.some((kw) => kw.includes(query))
          );
          setMenuItems(items);
          setSelectedIndex(0);
          setShowMenu(items.length > 0);
        } else {
          setShowMenu(false);
        }
      });
    });

    return removeListener;
  }, [editor, getMenuItems]);

  useEffect(() => {
    if (!showMenu) return;

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (showMenu && menuItems.length > 0) {
          event?.preventDefault();
          const item = menuItems[selectedIndex];
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();
              if ($isTextNode(anchorNode)) {
                anchorNode.setTextContent('');
              }
            }
          });
          item.action();
          setShowMenu(false);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, showMenu, menuItems, selectedIndex]);

  useEffect(() => {
    if (!showMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMenu, menuItems.length]);

  if (!showMenu || menuItems.length === 0) return null;

  return (
    <div
      className="fixed z-50 w-64 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {menuItems.map((item, index) => (
        <button
          key={item.title}
          className={`flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer ${
            index === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50'
          }`}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                if ($isTextNode(anchorNode)) {
                  anchorNode.setTextContent('');
                }
              }
            });
            item.action();
            setShowMenu(false);
          }}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-mono shrink-0">
            {item.icon}
          </span>
          <div className="flex flex-col items-start">
            <span className="font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              {item.description}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
