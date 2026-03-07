'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, SerializedEditorState } from 'lexical';

interface OnChangePluginProps {
  onChange?: (state: SerializedEditorState) => void;
}

export default function OnChangePlugin({ onChange }: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onChange) return;

    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState.toJSON());
    });
  }, [editor, onChange]);

  return null;
}
