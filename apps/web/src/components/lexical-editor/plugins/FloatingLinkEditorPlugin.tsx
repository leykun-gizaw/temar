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
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { ExternalLink, Pencil, Unlink, Check, X } from 'lucide-react';

export default function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isLink, setIsLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateLink = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      setIsLink(false);
      setPosition(null);
      return;
    }

    const node = selection.anchor.getNode();
    const parent = node.getParent();
    const linkNode = $isLinkNode(parent) ? parent : $isLinkNode(node) ? node : null;

    if (linkNode && $isLinkNode(linkNode)) {
      setIsLink(true);
      setLinkUrl(linkNode.getURL());

      // Get position
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    } else {
      setIsLink(false);
      setPosition(null);
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateLink();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateLink]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateLink();
      });
    });
  }, [editor, updateLink]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditUrl(linkUrl);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editUrl.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, editUrl.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUnlink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setIsLink(false);
    setPosition(null);
  };

  if (!isLink || !position) return null;

  return createPortal(
    <div
      className="fixed z-50 flex items-center gap-1 rounded-md border bg-popover px-2 py-1.5 text-sm text-popover-foreground shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-sm w-48 font-mono"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder="https://"
          />
          <button
            type="button"
            className="p-1 rounded-sm hover:bg-accent/50 text-green-600"
            onClick={handleSave}
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-sm hover:bg-accent/50 text-muted-foreground"
            onClick={handleCancel}
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline truncate max-w-[200px] font-mono text-xs"
          >
            {linkUrl}
          </a>
          <button
            type="button"
            className="p-1 rounded-sm hover:bg-accent/50 text-muted-foreground"
            onClick={() => window.open(linkUrl, '_blank', 'noopener')}
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-sm hover:bg-accent/50 text-muted-foreground"
            onClick={handleEdit}
            title="Edit link"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-sm hover:bg-accent/50 text-red-500"
            onClick={handleUnlink}
            title="Remove link"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
