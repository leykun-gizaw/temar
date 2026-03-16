'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $createParagraphNode,
  type NodeKey,
} from 'lexical';
import { GripVertical, Plus } from 'lucide-react';
import { getBlockMenuItems, type BlockMenuItem } from '../utils/block-menu-items';

const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';

function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement;
}

/**
 * Walk DOM upward from target to find the nearest block-level element
 * that is a direct child of the editor root content editable.
 */
function getBlockElement(
  anchorElem: HTMLElement,
  editorElem: HTMLElement,
  target: HTMLElement
): HTMLElement | null {
  let current: HTMLElement | null = target;
  while (current && current !== editorElem) {
    if (current.parentElement === anchorElem) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getNodeKeyFromDom(
  element: HTMLElement,
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): NodeKey | null {
  // Lexical stores __lexicalKey_<editorKey> on DOM elements
  const keys = Object.keys(element).filter((k) =>
    k.startsWith('__lexicalKey_')
  );
  if (keys.length > 0) {
    return (element as unknown as Record<string, unknown>)[keys[0]] as NodeKey;
  }
  return null;
}

interface DraggableBlockPluginProps {
  anchorElem?: HTMLElement;
}

export default function DraggableBlockPlugin({
  anchorElem,
}: DraggableBlockPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [targetBlockElem, setTargetBlockElem] = useState<HTMLElement | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const [dropIndicatorY, setDropIndicatorY] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ top: 0, left: 0 });
  const draggedNodeKey = useRef<NodeKey | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const rootElement = editor.getRootElement();
  const anchor = anchorElem || rootElement?.parentElement;

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragging) return;
      const target = event.target;
      if (!isHTMLElement(target) || !rootElement || !anchor) {
        setTargetBlockElem(null);
        return;
      }
      if (!rootElement.contains(target)) {
        setTargetBlockElem(null);
        return;
      }
      const block = getBlockElement(rootElement, rootElement, target);
      setTargetBlockElem(block);
    },
    [rootElement, anchor, dragging]
  );

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAddMenu]);

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!targetBlockElem) return;
      const nodeKey = getNodeKeyFromDom(targetBlockElem, editor);
      if (!nodeKey) return;
      draggedNodeKey.current = nodeKey;
      event.dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
      event.dataTransfer.effectAllowed = 'move';
      setDragging(true);
      // Transparent drag image
      const img = new Image();
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      event.dataTransfer.setDragImage(img, 0, 0);
    },
    [targetBlockElem, editor]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (!rootElement) return;
      // Find the block element nearest the mouse
      const children = Array.from(rootElement.children) as HTMLElement[];
      let closestY = Infinity;
      let closestIdx = -1;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(event.clientY - midY);
        if (dist < closestY) {
          closestY = dist;
          closestIdx = i;
        }
      }
      if (closestIdx >= 0) {
        const rect = children[closestIdx].getBoundingClientRect();
        const rootRect = rootElement.getBoundingClientRect();
        const insertBefore = event.clientY < rect.top + rect.height / 2;
        const y = insertBefore
          ? rect.top - rootRect.top
          : rect.bottom - rootRect.top;
        setDropIndicatorY(y);
      }
    },
    [rootElement]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeKey = event.dataTransfer.getData(DRAG_DATA_FORMAT);
      setDragging(false);
      setDropIndicatorY(null);
      if (!nodeKey || !rootElement) return;

      // Find drop target
      const children = Array.from(rootElement.children) as HTMLElement[];
      let closestIdx = -1;
      let insertBefore = false;
      let closestDist = Infinity;

      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(event.clientY - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
          insertBefore = event.clientY < midY;
        }
      }

      if (closestIdx < 0) return;

      const targetElem = children[closestIdx];
      const targetKey = getNodeKeyFromDom(targetElem, editor);
      if (!targetKey || targetKey === nodeKey) return;

      editor.update(() => {
        const draggedNode = $getNodeByKey(nodeKey);
        const targetNode = $getNodeByKey(targetKey);
        if (!draggedNode || !targetNode) return;
        draggedNode.remove();
        if (insertBefore) {
          targetNode.insertBefore(draggedNode);
        } else {
          targetNode.insertAfter(draggedNode);
        }
      });
    },
    [editor, rootElement]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setDropIndicatorY(null);
    draggedNodeKey.current = null;
  }, []);

  const handleAddClick = useCallback(() => {
    if (!targetBlockElem) return;
    const rect = targetBlockElem.getBoundingClientRect();
    setAddMenuPosition({ top: rect.bottom + 4, left: rect.left });
    setShowAddMenu(true);
  }, [targetBlockElem]);

  const handleMenuItemClick = useCallback(
    (item: BlockMenuItem) => {
      if (!targetBlockElem) {
        setShowAddMenu(false);
        return;
      }

      const targetKey = getNodeKeyFromDom(targetBlockElem, editor);

      // Insert a new paragraph after the target block, then execute the action
      editor.update(() => {
        if (targetKey) {
          const targetNode = $getNodeByKey(targetKey);
          if (targetNode) {
            const p = $createParagraphNode();
            targetNode.insertAfter(p);
            p.selectStart();
          }
        }
      });

      // Small delay to ensure selection is set before action
      setTimeout(() => {
        item.action(editor);
        setShowAddMenu(false);
      }, 0);
    },
    [editor, targetBlockElem]
  );

  if (!rootElement || !anchor) return null;

  const menuItems = getBlockMenuItems();

  // Calculate handle position
  let handleTop = 0;
  let handleLeft = 0;
  if (targetBlockElem && !dragging) {
    const blockRect = targetBlockElem.getBoundingClientRect();
    const rootRect = rootElement.getBoundingClientRect();
    handleTop = blockRect.top - rootRect.top;
    handleLeft = -36;
  }

  return (
    <>
      {/* Drag handle + add button */}
      {targetBlockElem && !dragging && (
        <div
          className="absolute flex items-center gap-0.5 z-10 opacity-0 hover:opacity-100 transition-opacity"
          style={{
            top: handleTop,
            left: handleLeft,
          }}
          // Make visible when block is hovered
          ref={(el) => {
            if (el) el.style.opacity = '1';
          }}
        >
          <button
            type="button"
            className="flex items-center justify-center w-5 h-6 rounded-sm text-muted-foreground hover:bg-accent/80 hover:text-foreground cursor-pointer transition-colors"
            onClick={handleAddClick}
            title="Add block"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div
            draggable
            className="flex items-center justify-center w-5 h-6 rounded-sm text-muted-foreground hover:bg-accent/80 hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Drop indicator line */}
      {dragging && dropIndicatorY !== null && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary z-20 pointer-events-none"
          style={{ top: dropIndicatorY }}
        />
      )}

      {/* Drag overlay (invisible, captures drag events on the entire editor area) */}
      {dragging && (
        <div
          className="absolute inset-0 z-10"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      {/* Add block menu */}
      {showAddMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-64 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{
              top: addMenuPosition.top,
              left: addMenuPosition.left,
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.title}
                type="button"
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent/50"
                onClick={() => handleMenuItemClick(item)}
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
          </div>,
          document.body
        )}
    </>
  );
}
