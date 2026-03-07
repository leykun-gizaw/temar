'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

interface SlashMenuItem {
  title: string;
  description: string;
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
        description: 'Large heading',
        action: () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createHeadingNode('h1');
              selection.insertNodes([node]);
            }
          });
        },
      },
      {
        title: 'Heading 2',
        description: 'Medium heading',
        action: () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createHeadingNode('h2');
              selection.insertNodes([node]);
            }
          });
        },
      },
      {
        title: 'Heading 3',
        description: 'Small heading',
        action: () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createHeadingNode('h3');
              selection.insertNodes([node]);
            }
          });
        },
      },
      {
        title: 'Bulleted List',
        description: 'Create a bulleted list',
        action: () => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        title: 'Numbered List',
        description: 'Create a numbered list',
        action: () => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        title: 'Divider',
        description: 'Insert a horizontal rule',
        action: () => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        },
      },
    ];
  }, [editor]);

  useEffect(() => {
    const removeListener = editor.registerTextContentListener((text) => {
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
              item.description.toLowerCase().includes(query)
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
      className="fixed z-50 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {menuItems.map((item, index) => (
        <button
          key={item.title}
          className={`flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-sm outline-none ${
            index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
          }`}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                if ($isTextNode(anchorNode)) anchorNode.setTextContent('');
              }
            });
            item.action();
            setShowMenu(false);
          }}
        >
          <span className="font-medium">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );
}
