'use client';

import type { SerializedEditorState } from 'lexical';
import LexicalEditor from './LexicalEditor';

interface AnswerEditorProps {
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  initialValue?: SerializedEditorState;
}

export default function AnswerEditor({
  onChange,
  placeholder = 'Write your answer here...',
  initialValue,
}: AnswerEditorProps) {
  return (
    <LexicalEditor
      initialState={initialValue}
      onChange={onChange}
      placeholder={placeholder}
      showToolbar
      className="bg-card border-0 h-full"
      editorClassName="max-w-none"
    />
  );
}
