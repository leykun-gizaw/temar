'use client';

import { Plate, usePlateEditor } from 'platejs/react';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { AnswerEditorKit } from './answer-editor-kit';
import { AnswerToolbarButtons } from './answer-toolbar-buttons';
import type { Value } from 'platejs';

interface AnswerEditorProps {
  onChange?: (value: Value) => void;
  placeholder?: string;
}

export default function AnswerEditor({
  onChange,
  placeholder = 'Write your answer here...',
}: AnswerEditorProps) {
  const editor = usePlateEditor({
    plugins: AnswerEditorKit,
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        onChange?.(value);
      }}
    >
      <FixedToolbar>
        <AnswerToolbarButtons />
      </FixedToolbar>
      <EditorContainer className="flex-1 min-h-0 overflow-y-auto">
        <Editor
          variant="none"
          placeholder={placeholder}
          className="min-h-[200px] px-6 py-4 pb-20"
        />
      </EditorContainer>
    </Plate>
  );
}
