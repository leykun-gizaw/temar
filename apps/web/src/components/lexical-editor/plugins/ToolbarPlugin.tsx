'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isRootOrShadowRoot,
} from 'lexical';
import {
  $isHeadingNode,
  $createHeadingNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';
import {
  $createHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Highlighter,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
  Quote,
  List,
  ListOrdered,
  Minus,
  FileCode,
} from 'lucide-react';

type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'quote'
  | 'code'
  | 'bullet'
  | 'number';

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Blockquote',
  code: 'Code Block',
  bullet: 'Bulleted List',
  number: 'Numbered List',
};

const BLOCK_TYPE_ICONS: Record<BlockType, React.ReactNode> = {
  paragraph: <Pilcrow className="h-3.5 w-3.5" />,
  h1: <Heading1 className="h-3.5 w-3.5" />,
  h2: <Heading2 className="h-3.5 w-3.5" />,
  h3: <Heading3 className="h-3.5 w-3.5" />,
  h4: <Heading4 className="h-3.5 w-3.5" />,
  h5: <Heading5 className="h-3.5 w-3.5" />,
  h6: <Heading6 className="h-3.5 w-3.5" />,
  quote: <Quote className="h-3.5 w-3.5" />,
  code: <FileCode className="h-3.5 w-3.5" />,
  bullet: <List className="h-3.5 w-3.5" />,
  number: <ListOrdered className="h-3.5 w-3.5" />,
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center h-7 w-7 rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const anchorNode = selection.anchor.getNode();
    let element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent();
            return parent !== null && $isRootOrShadowRoot(parent);
          });

    if (element === null) {
      element = anchorNode.getTopLevelElementOrThrow();
    }

    // Block type
    if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as BlockType);
    } else if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType(anchorNode, ListNode);
      if (parentList) {
        setBlockType(
          parentList.getListType() === 'number' ? 'number' : 'bullet'
        );
      }
    } else if ($isQuoteNode(element)) {
      setBlockType('quote');
    } else if ($isCodeNode(element)) {
      setBlockType('code');
    } else {
      setBlockType('paragraph');
    }

    // Inline formats
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));
    setIsHighlight(selection.hasFormat('highlight'));
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        $updateToolbar();
      });
    });
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  const formatBlock = useCallback(
    (type: BlockType) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        if (type === 'paragraph') {
          if (blockType !== 'paragraph') {
            selection.insertNodes([$createParagraphNode()]);
          }
        } else if (
          type === 'h1' ||
          type === 'h2' ||
          type === 'h3' ||
          type === 'h4' ||
          type === 'h5' ||
          type === 'h6'
        ) {
          if (blockType !== type) {
            selection.insertNodes([$createHeadingNode(type as HeadingTagType)]);
          }
        } else if (type === 'quote') {
          if (blockType !== 'quote') {
            selection.insertNodes([$createQuoteNode()]);
          }
        } else if (type === 'code') {
          if (blockType !== 'code') {
            selection.insertNodes([$createCodeNode()]);
          }
        }
      });

      if (type === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (type === 'number') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }

      setShowBlockMenu(false);
    },
    [editor, blockType]
  );

  const insertHorizontalRule = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const hr = $createHorizontalRuleNode();
        selection.insertNodes([hr, $createParagraphNode()]);
      }
    });
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-2 py-1 border-b bg-muted/30 shrink-0">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Block type selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowBlockMenu((v) => !v)}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-sm text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
          title="Block type"
        >
          {BLOCK_TYPE_ICONS[blockType]}
          <span className="hidden sm:inline">
            {BLOCK_TYPE_LABELS[blockType]}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {showBlockMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowBlockMenu(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-md border bg-popover shadow-md">
              <div className="p-1">
                {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => formatBlock(type)}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                      blockType === type
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    {BLOCK_TYPE_ICONS[type]}
                    {BLOCK_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* Insert Divider */}
      <ToolbarButton onClick={insertHorizontalRule} title="Insert divider">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Inline format buttons */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        active={isBold}
        title="Bold (⌘B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        active={isItalic}
        title="Italic (⌘I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        active={isUnderline}
        title="Underline (⌘U)"
      >
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        }
        active={isStrikethrough}
        title="Strikethrough (⌘⇧M)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        active={isCode}
        title="Code (⌘E)"
      >
        <Code2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')}
        active={isHighlight}
        title="Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
