'use client';

import { useState, useEffect, useCallback, useMemo, Children } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Layers,
  ChevronLeft,
  Pencil,
  Trash2,
  Loader2,
  Notebook,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AddTopicDialog from './add-topic-dialog';
import AddNoteDialog from '@/components/add-note-dialog';
import AddChunkDialog from '@/app/dashboard/topics/[topicId]/notes/[noteId]/_components/add-chunk-dialog';
import EditDialog from '@/components/edit-dialog';
import TrackingButton from '@/components/tracking-button';
import Blinker from '@/components/blinker';
import { deleteTopic } from '@/lib/actions/delete';
import { deleteNote } from '@/lib/actions/delete';
import { deleteChunk } from '@/lib/actions/delete';
import { updateTopic } from '@/lib/actions/update';
import { updateNote } from '@/lib/actions/update';
import { updateChunk } from '@/lib/actions/update';

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface Note {
  id: string;
  name: string;
  description: string;
}

interface Chunk {
  id: string;
  name: string;
  description: string;
  contentMd: string | null;
  contentJson: unknown;
}

interface TrackedItem {
  chunkId: string;
}

interface TopicsBrowserProps {
  topics: Topic[];
  trackedItems: TrackedItem[];
  /** Map of topicId → boolean */
  topicTrackedMap: Record<string, boolean>;
}

// ── Mobile view states ──
type MobilePanel = 'notes' | 'chunks' | 'content';

// ── Markdown components for react-markdown v10 ──
// In v10, fenced code blocks are rendered as <pre><code class="language-xxx">
// so we intercept at the `pre` level, not `code`.
const markdownComponents = {
  pre({ children }: { children?: React.ReactNode }) {
    const childArray = Children.toArray(children);
    const first = childArray[0] as
      | React.ReactElement<{
          className?: string;
          children?: React.ReactNode;
        }>
      | undefined;

    const className = first?.props?.className ?? '';
    const match = /language-(\w+)/.exec(className);
    const lang = match?.[1] ?? '';
    const code = String(first?.props?.children ?? '').replace(/\n$/, '');

    console.log('pre block:', {
      className,
      lang,
      codePreview: code.slice(0, 50),
    });
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={lang || 'text'}
        PreTag="div"
        className="rounded-md text-sm my-3"
      >
        {code}
      </SyntaxHighlighter>
    );
  },
  code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
    // This now only handles inline backtick code, not fenced blocks
    return (
      <code
        className={`bg-muted px-1 py-0.5 rounded text-sm font-mono ${
          className ?? ''
        }`}
        {...props}
      >
        {children}
      </code>
    );
  },
};

export default function TopicsBrowser({
  topics,
  trackedItems,
  topicTrackedMap,
}: TopicsBrowserProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    topics[0]?.id ?? ''
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('notes');

  const trackedChunkIds = useMemo(
    () => new Set(trackedItems.map((t) => t.chunkId)),
    [trackedItems]
  );

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null;
  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;
  const selectedChunk = chunks.find((c) => c.id === selectedChunkId) ?? null;

  // Fetch notes when topic changes
  const fetchNotes = useCallback(async (topicId: string) => {
    setIsLoadingNotes(true);
    setNotes([]);
    setSelectedNoteId(null);
    setChunks([]);
    setSelectedChunkId(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/notes`);
      if (res.ok) {
        const data: Note[] = await res.json();
        setNotes(data);
        if (data.length > 0) {
          setSelectedNoteId(data[0].id);
        }
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  // Fetch chunks when note changes
  const fetchChunks = useCallback(async (noteId: string) => {
    setIsLoadingChunks(true);
    setChunks([]);
    setSelectedChunkId(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/chunks`);
      if (res.ok) {
        const data: Chunk[] = await res.json();
        setChunks(data);
        if (data.length > 0) {
          setSelectedChunkId(data[0].id);
        }
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingChunks(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      fetchNotes(selectedTopicId);
    }
  }, [selectedTopicId, fetchNotes]);

  useEffect(() => {
    if (selectedNoteId) {
      fetchChunks(selectedNoteId);
    }
  }, [selectedNoteId, fetchChunks]);

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    setMobilePanel('notes');
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setMobilePanel('chunks');
  };

  const handleChunkSelect = (chunkId: string) => {
    setSelectedChunkId(chunkId);
    setMobilePanel('content');
  };

  // ── Render helpers ──

  const notesList = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Notebook className="h-3.5 w-3.5" />
          Notes
        </span>
        {selectedTopicId && (
          <AddNoteDialog
            topicId={selectedTopicId}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingNotes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No notes yet
          </div>
        ) : (
          notes.map((n) => (
            <div
              role="button"
              key={n.id}
              onClick={() => handleNoteSelect(n.id)}
              className={`w-full text-left px-3 py-2.5 border-b transition-colors hover:bg-muted/50 hover:cursor-pointer group ${
                n.id === selectedNoteId ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium truncate flex items-center gap-1.5">
                  <span>📘</span>
                  {n.name}
                </p>
                <div
                  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EditDialog
                    entityType="note"
                    currentName={n.name}
                    currentDescription={n.description}
                    onSave={async (name, description) => {
                      await updateNote(
                        n.id,
                        selectedTopicId,
                        name,
                        description
                      );
                    }}
                    trigger={
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary p-0.5"
                      >
                        <Pencil size={11} />
                      </button>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this note and all its chunks?')) {
                        deleteNote(n.id, selectedTopicId);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                  >
                    <Trash2 size={11} />
                  </button>
                  <TrackingButton
                    entityType="note"
                    entityId={n.id}
                    topicId={selectedTopicId}
                    isTracked={false}
                    compact
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                {n.description || 'No description'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const chunksList = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Chunks
        </span>
        {selectedNoteId && selectedTopicId && (
          <AddChunkDialog
            noteId={selectedNoteId}
            topicId={selectedTopicId}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingChunks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : chunks.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            {selectedNoteId ? 'No chunks yet' : 'Select a note'}
          </div>
        ) : (
          chunks.map((c) => {
            const isTracked = trackedChunkIds.has(c.id);
            return (
              <div
                role="button"
                key={c.id}
                onClick={() => handleChunkSelect(c.id)}
                className={`w-full text-left px-3 py-2.5 border-b transition-colors hover:bg-muted/50 hover:cursor-pointer group relative ${
                  c.id === selectedChunkId ? 'bg-muted' : ''
                }`}
              >
                {isTracked && (
                  <div className="absolute top-1.5 right-1.5">
                    <Blinker />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate flex items-center gap-1.5 pr-4">
                    <span>📄</span>
                    {c.name}
                  </p>
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditDialog
                      entityType="chunk"
                      currentName={c.name}
                      currentDescription={c.description}
                      onSave={async (name, desc) => {
                        await updateChunk(
                          c.id,
                          selectedNoteId ?? '',
                          selectedTopicId,
                          name,
                          desc
                        );
                      }}
                      trigger={
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-primary p-0.5"
                        >
                          <Pencil size={11} />
                        </button>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this chunk?')) {
                          deleteChunk(
                            c.id,
                            selectedNoteId ?? '',
                            selectedTopicId
                          );
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                    <TrackingButton
                      entityType="chunk"
                      entityId={c.id}
                      topicId={selectedTopicId}
                      noteId={selectedNoteId ?? ''}
                      isTracked={isTracked}
                      compact
                      contentLength={
                        c.contentMd?.length ?? c.description?.length ?? 0
                      }
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {c.description || 'No description'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const contentPanel = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
        {selectedChunk && (
          <>
            <span className="text-xs text-muted-foreground truncate">
              {selectedTopic?.name}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground truncate">
              {selectedNote?.name}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium truncate">
              {selectedChunk.name}
            </span>
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {selectedChunk ? (
          <div className="p-5">
            <h2 className="text-lg font-semibold mb-1">
              📄 {selectedChunk.name}
            </h2>
            {selectedChunk.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {selectedChunk.description}
              </p>
            )}
            <hr className="mb-4" />
            {selectedChunk.contentMd ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {selectedChunk.contentMd}
                </Markdown>
              </div>
            ) : selectedChunk.contentJson ? (
              <pre className="text-sm whitespace-pre-wrap break-words p-4 bg-muted/30 rounded-md">
                {JSON.stringify(selectedChunk.contentJson, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No content available
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select a chunk to view its content
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-rows-[auto_1fr] h-[calc(100vh-var(--header-height))]">
      {/* ── Sub-header: Topic selector ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">📚 Topics</span>
          <Select value={selectedTopicId} onValueChange={handleTopicChange}>
            <SelectTrigger className="h-7 w-[220px] text-xs">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTopic && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <EditDialog
                entityType="topic"
                currentName={selectedTopic.name}
                currentDescription={selectedTopic.description}
                onSave={async (name, description) => {
                  await updateTopic(selectedTopic.id, name, description);
                }}
                trigger={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary p-1"
                    title="Edit topic"
                  >
                    <Pencil size={12} />
                  </button>
                }
              />
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this topic and all its notes/chunks?')) {
                    deleteTopic(selectedTopic.id);
                  }
                }}
                className="text-muted-foreground hover:text-destructive p-1"
                title="Delete topic"
              >
                <Trash2 size={12} />
              </button>
              <TrackingButton
                entityType="topic"
                entityId={selectedTopic.id}
                isTracked={topicTrackedMap[selectedTopic.id] ?? false}
                compact
              />
            </div>
          )}
        </div>
        <AddTopicDialog
          trigger={
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Topic
            </Button>
          }
        />
      </div>

      {/* ── DESKTOP: Three-panel split view ── */}
      <div className="hidden md:grid md:grid-cols-[200px_1px_200px_1px_1fr] min-h-0">
        {notesList}
        <div className="bg-border" />
        {chunksList}
        <div className="bg-border" />
        {contentPanel}
      </div>

      {/* ── MOBILE: Stacked panels with back navigation ── */}
      <div className="md:hidden flex flex-col min-h-0">
        {/* Mobile breadcrumb bar */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/20 shrink-0">
          {mobilePanel === 'chunks' && (
            <button
              onClick={() => setMobilePanel('notes')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Notes
            </button>
          )}
          {mobilePanel === 'content' && (
            <button
              onClick={() => setMobilePanel('chunks')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Chunks
            </button>
          )}
          {mobilePanel === 'notes' && (
            <span className="text-xs text-muted-foreground">
              {selectedTopic?.name ?? 'Select a topic'}
            </span>
          )}
          {mobilePanel === 'chunks' && selectedNote && (
            <span className="text-xs font-medium ml-1">
              {selectedNote.name}
            </span>
          )}
          {mobilePanel === 'content' && selectedChunk && (
            <span className="text-xs font-medium ml-1">
              {selectedChunk.name}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {mobilePanel === 'notes' && notesList}
          {mobilePanel === 'chunks' && chunksList}
          {mobilePanel === 'content' && contentPanel}
        </div>
      </div>
    </div>
  );
}
