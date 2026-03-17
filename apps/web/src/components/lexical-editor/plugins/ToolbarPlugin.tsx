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
  COMMAND_PRIORITY_LOW,
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
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection';
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
  Eraser,
  Palette,
  Type,
  Columns3,
  SeparatorHorizontal,
  PaintBucket,
} from 'lucide-react';
import { $createImageNode } from '../nodes/ImageNode';
import { $createEquationNode } from '../nodes/EquationNode';
import { $createMermaidNode } from '../nodes/MermaidNode';
import { $createYouTubeNode } from '../nodes/YouTubeNode';
import { INSERT_COLLAPSIBLE_COMMAND } from './CollapsiblePlugin';
import { INSERT_PAGE_BREAK_COMMAND } from '../utils/block-menu-items';
import { insertLayout } from './LayoutPlugin';
import InsertTableDialog from '../ui/InsertTableDialog';
import InsertImageDialog from '../ui/InsertImageDialog';
import InsertEquationDialog from '../ui/InsertEquationDialog';
import InsertMermaidDialog from '../ui/InsertMermaidDialog';
import InsertYouTubeDialog from '../ui/InsertYouTubeDialog';
import InsertLayoutDialog from '../ui/InsertLayoutDialog';
import ColorPicker from '../ui/ColorPicker';

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

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, monospace' },
];

const FONT_SIZES = [
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '72px',
];

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
  const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [fontColor, setFontColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('');

  // Dialog states
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showEquationDialog, setShowEquationDialog] = useState(false);
  const [equationInline, setEquationInline] = useState(false);
  const [showMermaidDialog, setShowMermaidDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

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

    // Font styles
    setFontFamily(
      $getSelectionStyleValueForProperty(selection, 'font-family', '')
    );
    setFontSize(
      $getSelectionStyleValueForProperty(selection, 'font-size', '')
    );
    setFontColor(
      $getSelectionStyleValueForProperty(selection, 'color', '#000000')
    );
    setBgColor(
      $getSelectionStyleValueForProperty(selection, 'background-color', '')
    );
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

  // Register dialog commands from block-menu-items
  useEffect(() => {
    const { OPEN_TABLE_DIALOG, OPEN_IMAGE_DIALOG, OPEN_EQUATION_DIALOG, OPEN_MERMAID_DIALOG, OPEN_YOUTUBE_DIALOG, OPEN_LAYOUT_DIALOG } = require('../utils/block-menu-items');
    const unregister = [
      editor.registerCommand(OPEN_TABLE_DIALOG, () => { setShowTableDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(OPEN_IMAGE_DIALOG, () => { setShowImageDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(OPEN_EQUATION_DIALOG, (payload: { inline: boolean }) => { setEquationInline(payload.inline); setShowEquationDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(OPEN_MERMAID_DIALOG, () => { setShowMermaidDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(OPEN_YOUTUBE_DIALOG, () => { setShowYouTubeDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(OPEN_LAYOUT_DIALOG, () => { setShowLayoutDialog(true); return true; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(INSERT_PAGE_BREAK_COMMAND, () => {
        const { $createPageBreakNode } = require('../nodes/PageBreakNode');
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([$createPageBreakNode(), $createParagraphNode()]);
          }
        });
        return true;
      }, COMMAND_PRIORITY_LOW),
    ];
    return () => unregister.forEach((fn) => fn());
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

  const applyFontFamily = useCallback(
    (family: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'font-family': family || null });
        }
      });
      setShowFontFamilyMenu(false);
    },
    [editor]
  );

  const applyFontSize = useCallback(
    (size: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'font-size': size || null });
        }
      });
      setShowFontSizeMenu(false);
    },
    [editor]
  );

  const applyFontColor = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { color });
        }
      });
    },
    [editor]
  );

  const applyBgColor = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'background-color': color });
        }
      });
    },
    [editor]
  );

  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      // Clear all text format flags
      const formats = [
        'bold', 'italic', 'underline', 'strikethrough',
        'code', 'highlight', 'superscript', 'subscript',
      ] as const;
      for (const format of formats) {
        if (selection.hasFormat(format)) {
          selection.toggleFormat(format);
        }
      }
      // Clear inline styles
      $patchStyleText(selection, {
        'font-family': null,
        'font-size': null,
        color: null,
        'background-color': null,
      });
    });
  }, [editor]);

  const insertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      // The FloatingLinkEditorPlugin handles link creation too,
      // but for toolbar we just set a default URL
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    }
  }, [editor, isLink]);

  const formatAlign = useCallback(
    (alignment: ElementFormatType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
      setShowAlignMenu(false);
    },
    [editor]
  );

  // Insert handlers for dialogs
  const handleInsertTable = useCallback(
    (rows: number, columns: number) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: String(rows),
        columns: String(columns),
        includeHeaders: true,
      });
    },
    [editor]
  );

  const handleInsertImage = useCallback(
    (src: string, altText: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createImageNode({ src, altText })]);
        }
      });
    },
    [editor]
  );

  const handleInsertEquation = useCallback(
    (equation: string, inline: boolean) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const nodes = [
            $createEquationNode(equation, inline),
            ...(inline ? [] : [$createParagraphNode()]),
          ];
          selection.insertNodes(nodes);
        }
      });
    },
    [editor]
  );

  const handleInsertMermaid = useCallback(
    (code: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([
            $createMermaidNode(code),
            $createParagraphNode(),
          ]);
        }
      });
    },
    [editor]
  );

  const handleInsertYouTube = useCallback(
    (videoID: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([
            $createYouTubeNode(videoID),
            $createParagraphNode(),
          ]);
        }
      });
    },
    [editor]
  );

  const handleInsertLayout = useCallback(
    (templateColumns: string, columnCount: number) => {
      insertLayout(editor, templateColumns, columnCount);
    },
    [editor]
  );

  return (
    <>
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

        {/* Font family */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontFamilyMenu((v) => !v)}
            className="inline-flex items-center gap-1 h-7 px-1.5 rounded-sm text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
            title="Font family"
          >
            <Type className="h-3.5 w-3.5" />
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          <DropdownMenu
            show={showFontFamilyMenu}
            onClose={() => setShowFontFamilyMenu(false)}
          >
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => applyFontFamily(f.value)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                  fontFamily === f.value
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
                style={f.value ? { fontFamily: f.value } : undefined}
              >
                {f.label}
              </button>
            ))}
          </DropdownMenu>
        </div>

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontSizeMenu((v) => !v)}
            className="inline-flex items-center gap-0.5 h-7 px-1.5 rounded-sm text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer min-w-[36px] justify-center"
            title="Font size"
          >
            <span className="text-[10px]">{fontSize || '16px'}</span>
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          <DropdownMenu
            show={showFontSizeMenu}
            onClose={() => setShowFontSizeMenu(false)}
          >
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => applyFontSize(size)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                  fontSize === size
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                {size}
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
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
          }
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
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')
          }
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
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
          }
          active={isSubscript}
          title="Subscript"
        >
          <Subscript className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Font color */}
        <ColorPicker color={fontColor} onChange={applyFontColor} onClear={() => applyFontColor('')}>
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-sm transition-colors cursor-pointer hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            title="Font color"
          >
            <div className="flex flex-col items-center">
              <Palette className="h-3 w-3" />
              <div
                className="w-3.5 h-0.5 rounded-full mt-px"
                style={{ backgroundColor: fontColor || '#000000' }}
              />
            </div>
          </button>
        </ColorPicker>

        {/* Background color */}
        <ColorPicker color={bgColor} onChange={applyBgColor} onClear={() => applyBgColor('')}>
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-sm transition-colors cursor-pointer hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            title="Background color"
          >
            <div className="flex flex-col items-center">
              <PaintBucket className="h-3 w-3" />
              <div
                className="w-3.5 h-0.5 rounded-full mt-px"
                style={{ backgroundColor: bgColor || 'transparent' }}
              />
            </div>
          </button>
        </ColorPicker>

        {/* Clear formatting */}
        <ToolbarButton onClick={clearFormatting} title="Clear formatting">
          <Eraser className="h-3.5 w-3.5" />
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
                editor.dispatchCommand(
                  INSERT_HORIZONTAL_RULE_COMMAND,
                  undefined
                );
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Minus className="h-3.5 w-3.5" /> Horizontal Rule
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTableDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Table className="h-3.5 w-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Image
            </button>
            <button
              type="button"
              onClick={() => {
                setEquationInline(false);
                setShowEquationDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Sigma className="h-3.5 w-3.5" /> Equation (Block)
            </button>
            <button
              type="button"
              onClick={() => {
                setEquationInline(true);
                setShowEquationDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Sigma className="h-3.5 w-3.5" /> Equation (Inline)
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMermaidDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Workflow className="h-3.5 w-3.5" /> Mermaid Diagram
            </button>
            <button
              type="button"
              onClick={() => {
                setShowYouTubeDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Youtube className="h-3.5 w-3.5" /> YouTube Video
            </button>
            <button
              type="button"
              onClick={() => {
                editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <ChevronsDownUp className="h-3.5 w-3.5" /> Collapsible Section
            </button>
            <button
              type="button"
              onClick={() => {
                editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <SeparatorHorizontal className="h-3.5 w-3.5" /> Page Break
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLayoutDialog(true);
                setShowInsertMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50"
            >
              <Columns3 className="h-3.5 w-3.5" /> Columns Layout
            </button>
          </DropdownMenu>
        </div>
      </div>

      {/* Insert dialogs */}
      <InsertTableDialog
        open={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleInsertTable}
      />
      <InsertImageDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleInsertImage}
      />
      <InsertEquationDialog
        open={showEquationDialog}
        onClose={() => setShowEquationDialog(false)}
        onInsert={handleInsertEquation}
        initialInline={equationInline}
      />
      <InsertMermaidDialog
        open={showMermaidDialog}
        onClose={() => setShowMermaidDialog(false)}
        onInsert={handleInsertMermaid}
      />
      <InsertYouTubeDialog
        open={showYouTubeDialog}
        onClose={() => setShowYouTubeDialog(false)}
        onInsert={handleInsertYouTube}
      />
      <InsertLayoutDialog
        open={showLayoutDialog}
        onClose={() => setShowLayoutDialog(false)}
        onInsert={handleInsertLayout}
      />
    </>
  );
}
