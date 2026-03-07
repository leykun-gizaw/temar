'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { createPortal } from 'react-dom';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Quote,
  Code2,
  Minus,
  List,
  ListOrdered,
} from 'lucide-react';

interface SlashMenuItem {
  title: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: (editor: LexicalEditor) => void;
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    title: 'Heading 1',
    icon: <Heading1 className="h-4 w-4" />,
    keywords: ['h1', 'heading', 'title'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h1')]);
        }
      }),
  },
  {
    title: 'Heading 2',
    icon: <Heading2 className="h-4 w-4" />,
    keywords: ['h2', 'heading', 'subtitle'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h2')]);
        }
      }),
  },
  {
    title: 'Heading 3',
    icon: <Heading3 className="h-4 w-4" />,
    keywords: ['h3', 'heading'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h3')]);
        }
      }),
  },
  {
    title: 'Heading 4',
    icon: <Heading4 className="h-4 w-4" />,
    keywords: ['h4', 'heading'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h4')]);
        }
      }),
  },
  {
    title: 'Heading 5',
    icon: <Heading5 className="h-4 w-4" />,
    keywords: ['h5', 'heading'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h5')]);
        }
      }),
  },
  {
    title: 'Heading 6',
    icon: <Heading6 className="h-4 w-4" />,
    keywords: ['h6', 'heading'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createHeadingNode('h6')]);
        }
      }),
  },
  {
    title: 'Blockquote',
    icon: <Quote className="h-4 w-4" />,
    keywords: ['quote', 'blockquote'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createQuoteNode()]);
        }
      }),
  },
  {
    title: 'Code Block',
    icon: <Code2 className="h-4 w-4" />,
    keywords: ['code', 'codeblock', 'snippet'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createCodeNode()]);
        }
      }),
  },
  {
    title: 'Divider',
    icon: <Minus className="h-4 w-4" />,
    keywords: ['divider', 'hr', 'horizontal', 'rule', 'line'],
    onSelect: (editor) =>
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const hr = $createHorizontalRuleNode();
          selection.insertNodes([hr, $createParagraphNode()]);
        }
      }),
  },
  {
    title: 'Bulleted List',
    icon: <List className="h-4 w-4" />,
    keywords: ['list', 'bullet', 'unordered', 'ul'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    },
  },
  {
    title: 'Numbered List',
    icon: <ListOrdered className="h-4 w-4" />,
    keywords: ['list', 'number', 'ordered', 'ol'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    },
  },
];

function SlashCommandMenu({
  editor,
  queryString,
  onClose,
  anchorElement,
}: {
  editor: LexicalEditor;
  queryString: string;
  onClose: () => void;
  anchorElement: HTMLElement | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!queryString) return SLASH_MENU_ITEMS;
    const q = queryString.toLowerCase();
    return SLASH_MENU_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [queryString]);

  const selectItem = useCallback(
    (index: number) => {
      const item = filteredItems[index];
      if (!item) return;

      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();
          const textContent = anchorNode.getTextContent();
          const slashIndex = textContent.lastIndexOf('/');
          if (slashIndex >= 0) {
            selection.anchor.set(anchor.key, slashIndex, 'text');
            selection.focus.set(anchor.key, textContent.length, 'text');
            selection.removeText();
          }
        }
      });

      item.onSelect(editor);
      onClose();
    },
    [editor, filteredItems, onClose]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [queryString]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (e) => {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, filteredItems.length]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, filteredItems.length]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (e) => {
        e?.preventDefault();
        selectItem(selectedIndex);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, selectedIndex, selectItem]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (e) => {
        e.preventDefault();
        selectItem(selectedIndex);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, selectedIndex, selectItem]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        onClose();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onClose]);

  if (filteredItems.length === 0 || !anchorElement) return null;

  const rect = anchorElement.getBoundingClientRect();

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-md"
      style={{
        top: rect.bottom + 4,
        left: rect.left,
      }}
    >
      <div className="p-1">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Insert block
        </div>
        {filteredItems.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {item.icon}
            {item.title}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [queryString, setQueryString] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleInput = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setIsOpen(false);
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const textContent = anchorNode.getTextContent().slice(0, anchor.offset);
        const slashMatch = textContent.match(/\/([^\s]*)$/);

        if (slashMatch) {
          setQueryString(slashMatch[1]);
          setIsOpen(true);
          setAnchorElement(rootElement);
        } else {
          setIsOpen(false);
        }
      });
    };

    return editor.registerUpdateListener(() => {
      handleInput();
    });
  }, [editor]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQueryString('');
  }, []);

  if (!isOpen) return null;

  return (
    <SlashCommandMenu
      editor={editor}
      queryString={queryString}
      onClose={handleClose}
      anchorElement={anchorElement}
    />
  );
}
