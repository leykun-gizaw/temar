'use client';

import type { SerializedEditorState } from 'lexical';
import LexicalEditor from './LexicalEditor';

interface ChunkEditorProps {
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  initialValue?: SerializedEditorState;
  editable?: boolean;
}

export default function ChunkEditor({
  onChange,
  placeholder = 'Write your chunk content here...',
  initialValue,
  editable = true,
}: ChunkEditorProps) {
  return (
    <LexicalEditor
      initialState={initialValue}
      onChange={onChange}
      placeholder={placeholder}
      showToolbar
      editable={editable}
      className={editable ? 'bg-card border-r border-l rounded-md' : ''}
      editorClassName="max-w-none"
    />
  );
}
