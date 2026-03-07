'use client';

import type { SerializedEditorState } from 'lexical';
import LexicalEditor from './LexicalEditor';

interface ChunkEditorProps {
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  initialValue?: SerializedEditorState;
}

export default function ChunkEditor({
  onChange,
  placeholder = 'Write your chunk content here...',
  initialValue,
}: ChunkEditorProps) {
  return (
    <LexicalEditor
      initialState={initialValue}
      onChange={onChange}
      placeholder={placeholder}
      showToolbar
      className="bg-card border rounded-md"
      editorClassName="prose prose-sm dark:prose-invert max-w-none"
    />
  );
}
