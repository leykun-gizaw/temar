'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import ChunkEditor from '@/components/lexical-editor/ChunkEditor';
import { updateChunkContent } from '@/lib/actions/chunks';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import type { SerializedEditorState } from 'lexical';
import Link from 'next/link';

interface ChunkEditClientProps {
  chunk: {
    id: string;
    name: string;
    description: string;
    contentJson: unknown;
    contentMd: string | null;
  };
  topicId: string;
  noteId: string;
  topicName: string;
  noteName: string;
}

export default function ChunkEditClient({
  chunk,
  topicId,
  noteId,
  topicName,
  noteName,
}: ChunkEditClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorStateRef = useRef<SerializedEditorState | null>(
    chunk.contentJson as SerializedEditorState | null
  );

  const handleSave = useCallback(async () => {
    if (!editorStateRef.current) return;

    setIsSaving(true);
    try {
      const markdown = lexicalToMarkdown(editorStateRef.current);
      await updateChunkContent(chunk.id, editorStateRef.current, markdown);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save chunk:', err);
    } finally {
      setIsSaving(false);
    }
  }, [chunk.id]);

  const handleChange = useCallback((state: SerializedEditorState) => {
    editorStateRef.current = state;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/topics/${topicId}/notes/${noteId}/chunks`}
            className="shrink-0"
          >
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              {topicName} / {noteName}
            </div>
            <h1 className="text-sm font-semibold truncate">
              📄 {chunk.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 text-xs"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <ChunkEditor
          initialValue={chunk.contentJson as SerializedEditorState | undefined}
          onChange={handleChange}
          placeholder={`Write content for "${chunk.name}"...`}
        />
      </div>
    </div>
  );
}
