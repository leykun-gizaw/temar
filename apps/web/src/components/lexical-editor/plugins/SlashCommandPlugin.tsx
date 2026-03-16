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
import {
  getBlockMenuItems,
  type BlockMenuItem,
} from '../utils/block-menu-items';

export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<BlockMenuItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const allItems = useCallback(() => getBlockMenuItems(), []);

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
          const items = allItems();
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
          const items = allItems().filter(
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
  }, [editor, allItems]);

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
          item.action(editor);
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
            item.action(editor);
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
