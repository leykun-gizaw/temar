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
  initialValue?: Value;
}

export default function AnswerEditor({
  onChange,
  placeholder = 'Write your answer here...',
  initialValue,
}: AnswerEditorProps) {
  const editor = usePlateEditor({
    plugins: AnswerEditorKit,
    ...(initialValue ? { value: initialValue } : {}),
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        onChange?.(value);
      }}
      {...(initialValue ? { value: initialValue } : {})}
    >
      <div className="flex flex-col h-full min-h-0 bg-card">
        <div className="shrink-0">
          <FixedToolbar>
            <AnswerToolbarButtons />
          </FixedToolbar>
        </div>
        <EditorContainer className="flex-1 min-h-0 overflow-y-auto">
          <Editor
            variant="none"
            placeholder={placeholder}
            className="min-h-[200px] px-4 py-3 pb-10 h-full"
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}
