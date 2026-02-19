'use client';

import { Plate, usePlateEditor } from 'platejs/react';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { BaseEditorKit } from './editor-base-kit';
import { CodeDrawingKit } from './plugins/code-drawing-kit';
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
    plugins: [...BaseEditorKit, ...CodeDrawingKit],
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
      <EditorContainer className="h-full min-h-0">
        <Editor placeholder={placeholder} className="min-h-[300px] p-4" />
      </EditorContainer>
    </Plate>
  );
}
