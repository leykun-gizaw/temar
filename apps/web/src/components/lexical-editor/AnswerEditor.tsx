'use client';

import type { SerializedEditorState } from 'lexical';
import LexicalEditor from './LexicalEditor';

interface AnswerEditorProps {
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  initialValue?: SerializedEditorState;
  editable?: boolean;
}

export default function AnswerEditor({
  onChange,
  placeholder = 'Write your answer here...',
  initialValue,
  editable = true,
}: AnswerEditorProps) {
  return (
    <LexicalEditor
      initialState={initialValue}
      onChange={onChange}
      placeholder={placeholder}
      showToolbar
      editable={editable}
      className="bg-card border-0 h-full"
      editorClassName="max-w-none"
    />
  );
}
