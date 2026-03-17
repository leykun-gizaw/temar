'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  $getTableCellNodeFromLexicalNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  TableCellHeaderStates,
  TableCellNode,
} from '@lexical/table';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';

export default function TableCellActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(
    null
  );
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const updateTableCell = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      setTableCellNode(null);
      return;
    }
    const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
    setTableCellNode(cell);
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateTableCell();
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateTableCell]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateTableCell();
      });
    });
  }, [editor, updateTableCell]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleShowMenu = useCallback(() => {
    if (!tableCellNode) return;
    const cellElem = editor.getElementByKey(tableCellNode.getKey());
    if (!cellElem) return;
    const rect = cellElem.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    setShowMenu(true);
  }, [editor, tableCellNode]);

  const insertRowAbove = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(false);
    });
    setShowMenu(false);
  }, [editor]);

  const insertRowBelow = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(true);
    });
    setShowMenu(false);
  }, [editor]);

  const insertColumnBefore = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(false);
    });
    setShowMenu(false);
  }, [editor]);

  const insertColumnAfter = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(true);
    });
    setShowMenu(false);
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
    });
    setShowMenu(false);
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
    });
    setShowMenu(false);
  }, [editor]);

  const toggleHeaderCell = useCallback(() => {
    if (!tableCellNode) return;
    editor.update(() => {
      tableCellNode.toggleHeaderStyle(TableCellHeaderStates.ROW);
    });
    setShowMenu(false);
  }, [editor, tableCellNode]);

  if (!tableCellNode || !editor.isEditable()) return null;

  return (
    <>
      {/* Small trigger button at top-right of selected cell */}
      <TableCellTrigger
        editor={editor}
        cellNode={tableCellNode}
        onClick={handleShowMenu}
      />

      {/* Context menu */}
      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-52 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <MenuItem
              icon={<ArrowUp className="w-3.5 h-3.5" />}
              label="Insert row above"
              onClick={insertRowAbove}
            />
            <MenuItem
              icon={<ArrowDown className="w-3.5 h-3.5" />}
              label="Insert row below"
              onClick={insertRowBelow}
            />
            <div className="h-px bg-border my-1" />
            <MenuItem
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              label="Insert column before"
              onClick={insertColumnBefore}
            />
            <MenuItem
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              label="Insert column after"
              onClick={insertColumnAfter}
            />
            <div className="h-px bg-border my-1" />
            <MenuItem
              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
              label="Delete row"
              onClick={deleteRow}
              danger
            />
            <MenuItem
              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
              label="Delete column"
              onClick={deleteColumn}
              danger
            />
            <div className="h-px bg-border my-1" />
            <MenuItem
              icon={<MoreHorizontal className="w-3.5 h-3.5" />}
              label="Toggle header"
              onClick={toggleHeaderCell}
            />
          </div>,
          document.body
        )}
    </>
  );
}

function TableCellTrigger({
  editor,
  cellNode,
  onClick,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  cellNode: TableCellNode;
  onClick: () => void;
}) {
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    const elem = editor.getElementByKey(cellNode.getKey());
    if (!elem) {
      setPosition(null);
      return;
    }
    const rect = elem.getBoundingClientRect();
    setPosition({ top: rect.top + 2, right: rect.right - 2 });
  }, [editor, cellNode]);

  if (!position) return null;

  return createPortal(
    <button
      type="button"
      className="fixed z-40 w-5 h-5 flex items-center justify-center rounded-sm bg-muted border shadow-sm hover:bg-accent/80 transition-colors"
      style={{
        top: position.top,
        left: position.right - 20,
      }}
      onClick={onClick}
      title="Table actions"
    >
      <MoreHorizontal className="w-3 h-3" />
    </button>,
    document.body
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50 ${
        danger ? 'text-red-500' : ''
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
