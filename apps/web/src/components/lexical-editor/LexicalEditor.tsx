'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import type { SerializedEditorState } from 'lexical';

import theme from './theme';
import { editorNodes } from './nodes';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import MarkdownShortcutsPlugin from './plugins/MarkdownShortcutsPlugin';
import SlashCommandPlugin from './plugins/SlashCommandPlugin';
import OnChangePlugin from './plugins/OnChangePlugin';

interface LexicalEditorProps {
  initialState?: SerializedEditorState;
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  showToolbar?: boolean;
  className?: string;
  editorClassName?: string;
}

export default function LexicalEditor({
  initialState,
  onChange,
  placeholder = 'Start writing...',
  showToolbar = true,
  className = '',
  editorClassName = '',
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'TemerEditor',
    theme,
    nodes: editorNodes,
    editorState: initialState ? JSON.stringify(initialState) : undefined,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`flex flex-col h-full min-h-0 ${className}`}>
        {showToolbar && (
          <div className="shrink-0">
            <ToolbarPlugin />
          </div>
        )}
        <div
          className={`flex-1 min-h-0 overflow-y-auto relative ${editorClassName}`}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] px-4 py-3 pb-10 outline-none h-full" />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-muted-foreground pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <HorizontalRulePlugin />
          <CodeHighlightPlugin />
          <MarkdownShortcutsPlugin />
          <SlashCommandPlugin />
          <OnChangePlugin onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}
