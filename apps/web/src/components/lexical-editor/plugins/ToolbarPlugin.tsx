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
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isRootOrShadowRoot,
  type ElementFormatType,
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
  INSERT_CHECK_LIST_COMMAND,
  ListNode,
} from '@lexical/list';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
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
  ListChecks,
  Minus,
  FileCode,
  Plus,
  Link2,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Superscript,
  Subscript,
  Table,
  ImageIcon,
  Sigma,
  Workflow,
  Youtube,
  ChevronsDownUp,
} from 'lucide-react';
import { $createImageNode } from '../nodes/ImageNode';
import { $createEquationNode } from '../nodes/EquationNode';
import { $createMermaidNode } from '../nodes/MermaidNode';
import { $createYouTubeNode } from '../nodes/YouTubeNode';
import { INSERT_COLLAPSIBLE_COMMAND } from './CollapsiblePlugin';

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
  | 'number'
  | 'check';

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
  check: 'Check List',
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
  check: <ListChecks className="h-3.5 w-3.5" />,
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

function DropdownMenu({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-md border bg-popover shadow-md">
        <div className="p-1">{children}</div>
      </div>
    </>
  );
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
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);

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
        const listType = parentList.getListType();
        if (listType === 'check') {
          setBlockType('check');
        } else if (listType === 'number') {
          setBlockType('number');
        } else {
          setBlockType('bullet');
        }
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
    setIsSuperscript(selection.hasFormat('superscript'));
    setIsSubscript(selection.hasFormat('subscript'));

    // Link detection
    const node = selection.anchor.getNode();
    const parent = node.getParent();
    setIsLink(parent !== null && parent.getType() === 'link');
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
      } else if (type === 'check') {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      }

      setShowBlockMenu(false);
    },
    [editor, blockType]
  );

  const insertTable = useCallback(() => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      const r = parseInt(rows, 10);
      const c = parseInt(cols, 10);
      if (r > 0 && c > 0) {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, {
          rows: String(r),
          columns: String(c),
          includeHeaders: true,
        });
      }
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertImage = useCallback(() => {
    const src = prompt('Image URL:');
    if (src) {
      const alt = prompt('Alt text (optional):', '') || '';
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createImageNode({ src, altText: alt });
          selection.insertNodes([node]);
        }
      });
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertEquation = useCallback(() => {
    const equation = prompt('LaTeX equation:', 'E = mc^2');
    if (equation) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createEquationNode(equation, false);
          selection.insertNodes([node, $createParagraphNode()]);
        }
      });
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertInlineEquation = useCallback(() => {
    const equation = prompt('Inline LaTeX equation:', 'x^2');
    if (equation) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createEquationNode(equation, true);
          selection.insertNodes([node]);
        }
      });
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertMermaid = useCallback(() => {
    const code = prompt(
      'Mermaid diagram code:',
      'graph TD\n    A[Start] --> B[End]'
    );
    if (code) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createMermaidNode(code);
          selection.insertNodes([node, $createParagraphNode()]);
        }
      });
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertYouTube = useCallback(() => {
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
          const node = $createYouTubeNode(videoID);
          selection.insertNodes([node, $createParagraphNode()]);
        }
      });
    }
    setShowInsertMenu(false);
  }, [editor]);

  const insertCollapsible = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
    setShowInsertMenu(false);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  }, [editor, isLink]);

  const formatAlign = useCallback(
    (alignment: ElementFormatType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
      setShowAlignMenu(false);
    },
    [editor]
  );

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
        <DropdownMenu
          show={showBlockMenu}
          onClose={() => setShowBlockMenu(false)}
        >
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
        </DropdownMenu>
      </div>

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
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        active={isCode}
        title="Inline Code (⌘E)"
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
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
        }
        active={isSuperscript}
        title="Superscript"
      >
        <Superscript className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
        active={isSubscript}
        title="Subscript"
      >
        <Subscript className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Link */}
      <ToolbarButton
        onClick={insertLink}
        active={isLink}
        title="Insert Link (⌘K)"
      >
        {isLink ? (
          <Unlink className="h-3.5 w-3.5" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowAlignMenu((v) => !v)}
          title="Text alignment"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <DropdownMenu
          show={showAlignMenu}
          onClose={() => setShowAlignMenu(false)}
        >
          <button
            type="button"
            onClick={() => formatAlign('left')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <AlignLeft className="h-3.5 w-3.5" /> Left
          </button>
          <button
            type="button"
            onClick={() => formatAlign('center')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <AlignCenter className="h-3.5 w-3.5" /> Center
          </button>
          <button
            type="button"
            onClick={() => formatAlign('right')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <AlignRight className="h-3.5 w-3.5" /> Right
          </button>
          <button
            type="button"
            onClick={() => formatAlign('justify')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <AlignJustify className="h-3.5 w-3.5" /> Justify
          </button>
        </DropdownMenu>
      </div>

      {/* Indent / Outdent */}
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
        title="Outdent"
      >
        <Outdent className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
        title="Indent"
      >
        <Indent className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Insert menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowInsertMenu((v) => !v)}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-sm text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
          title="Insert"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Insert</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <DropdownMenu
          show={showInsertMenu}
          onClose={() => setShowInsertMenu(false)}
        >
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
              setShowInsertMenu(false);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Minus className="h-3.5 w-3.5" /> Horizontal Rule
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Table className="h-3.5 w-3.5" /> Table
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Image
          </button>
          <button
            type="button"
            onClick={insertEquation}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Sigma className="h-3.5 w-3.5" /> Equation (Block)
          </button>
          <button
            type="button"
            onClick={insertInlineEquation}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Sigma className="h-3.5 w-3.5" /> Equation (Inline)
          </button>
          <button
            type="button"
            onClick={insertMermaid}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Workflow className="h-3.5 w-3.5" /> Mermaid Diagram
          </button>
          <button
            type="button"
            onClick={insertYouTube}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <Youtube className="h-3.5 w-3.5" /> YouTube Video
          </button>
          <button
            type="button"
            onClick={insertCollapsible}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" /> Collapsible Section
          </button>
        </DropdownMenu>
      </div>
    </div>
  );
}
