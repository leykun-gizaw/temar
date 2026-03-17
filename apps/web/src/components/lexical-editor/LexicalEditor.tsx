'use client';

import { useCallback, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import type { SerializedEditorState } from 'lexical';
import 'katex/dist/katex.min.css';

import theme from './theme';
import { editorNodes } from './nodes';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import MarkdownShortcutsPlugin from './plugins/MarkdownShortcutsPlugin';
import MarkdownPastePlugin from './plugins/MarkdownPastePlugin';
import SlashCommandPlugin from './plugins/SlashCommandPlugin';
import OnChangePlugin from './plugins/OnChangePlugin';
import LinkPlugin from './plugins/LinkPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import TableCellActionMenuPlugin from './plugins/TableCellActionMenuPlugin';
import LayoutPlugin from './plugins/LayoutPlugin';

interface LexicalEditorProps {
  initialState?: SerializedEditorState;
  onChange?: (state: SerializedEditorState) => void;
  placeholder?: string;
  showToolbar?: boolean;
  editable?: boolean;
  className?: string;
  editorClassName?: string;
}

export default function LexicalEditor({
  initialState,
  onChange,
  placeholder = 'Start writing...',
  showToolbar = true,
  editable = true,
  className = '',
  editorClassName = '',
}: LexicalEditorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Brief spin animation before resetting
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const initialConfig = {
    namespace: 'TemerEditor',
    theme,
    nodes: editorNodes,
    editable,
    editorState: initialState ? JSON.stringify(initialState) : undefined,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <LexicalComposer key={refreshKey} initialConfig={initialConfig}>
      <div className={`flex flex-col h-full min-h-0 ${className}`}>
        {editable && showToolbar && (
          <div className="shrink-0">
            <ToolbarPlugin />
          </div>
        )}
        {!editable && (
          <div className="flex justify-end px-2 py-1 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              onClick={handleRefresh}
              title="Refresh content"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}
        <div
          ref={scrollRef}
          className={`flex-1 min-h-0 overflow-y-auto relative ${editorClassName}`}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`outline-none h-full ${
                  editable ? 'min-h-[200px] px-4 py-3 pb-10' : 'px-4 py-3'
                } ${editable && showToolbar ? 'pl-12' : ''}`}
              />
            }
            placeholder={
              editable ? (
                <div
                  className={`absolute top-3 text-muted-foreground pointer-events-none select-none ${
                    showToolbar ? 'left-12' : 'left-4'
                  }`}
                >
                  {placeholder}
                </div>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ListPlugin />
          <CheckListPlugin />
          <HorizontalRulePlugin />
          <TablePlugin />
          <CodeHighlightPlugin />
          {editable && (
            <>
              <HistoryPlugin />
              <TabIndentationPlugin />
              <CodeActionMenuPlugin />
              <MarkdownShortcutsPlugin />
              <MarkdownPastePlugin />
              <SlashCommandPlugin />
              <LinkPlugin />
              <AutoLinkPlugin />
              <CollapsiblePlugin />
              <LayoutPlugin />
              <FloatingLinkEditorPlugin />
              <TableCellActionMenuPlugin />
              {showToolbar && <DraggableBlockPlugin />}
              <OnChangePlugin onChange={onChange} />
            </>
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}
