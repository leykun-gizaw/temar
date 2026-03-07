'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Layers,
  PanelLeftClose,
  PanelLeft,
  Save,
} from 'lucide-react';
import type { SerializedEditorState } from 'lexical';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AddTopicDialog } from './add-topic-dialog';
import AddNoteDialog from '@/components/add-note-dialog';
import AddChunkDialog from './add-chunk-dialog';
import EditDialog from '@/components/edit-dialog';
import TrackingButton from '@/components/tracking-button';
import Blinker from '@/components/blinker';
import ChunkEditor from '@/components/lexical-editor/ChunkEditor';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import { deleteTopic } from '@/lib/actions/delete';
import { deleteNote } from '@/lib/actions/delete';
import { deleteChunk } from '@/lib/actions/delete';
import { updateTopic } from '@/lib/actions/update';
import { updateNote } from '@/lib/actions/update';
import { updateChunk } from '@/lib/actions/update';
import { updateChunkContent } from '@/lib/actions/chunks';

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

interface MaterialsBrowserProps {
  topics: Topic[];
  trackedItems: TrackedItem[];
  topicTrackedMap: Record<string, boolean>;
}

const markdownComponents = {
  code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      return (
        <pre className="bg-muted/50 rounded-md p-3 overflow-auto my-3">
          <code className={`text-sm font-mono ${className ?? ''}`} {...props}>
            {children}
          </code>
        </pre>
      );
    }
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

export default function MaterialsBrowser({
  topics,
  trackedItems,
  topicTrackedMap,
}: MaterialsBrowserProps) {
  // ── Tree state ──
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notesMap, setNotesMap] = useState<Record<string, Note[]>>({});
  const [chunksMap, setChunksMap] = useState<Record<string, Chunk[]>>({});
  const [loadingNotes, setLoadingNotes] = useState<Set<string>>(new Set());
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());

  // ── Selection ──
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [selectedChunkMeta, setSelectedChunkMeta] = useState<{
    topicId: string;
    topicName: string;
    noteId: string;
    noteName: string;
  } | null>(null);

  // ── Editor state ──
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ── Sidebar ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const trackedChunkIds = useMemo(
    () => new Set(trackedItems.map((t) => t.chunkId)),
    [trackedItems]
  );

  const selectedChunk = useMemo(() => {
    if (!selectedChunkId || !selectedChunkMeta) return null;
    const chunks = chunksMap[selectedChunkMeta.noteId];
    return chunks?.find((c) => c.id === selectedChunkId) ?? null;
  }, [selectedChunkId, selectedChunkMeta, chunksMap]);

  // ── Fetch notes for a topic ──
  const fetchNotes = useCallback(async (topicId: string, force = false) => {
    if (!force) {
      let exists = false;
      setNotesMap((m) => {
        exists = !!m[topicId];
        return m;
      });
      if (exists) return;
    }
    setLoadingNotes((s) => new Set(s).add(topicId));
    try {
      const res = await fetch(`/api/topics/${topicId}/notes`);
      if (res.ok) {
        const data: Note[] = await res.json();
        setNotesMap((m) => ({ ...m, [topicId]: data }));
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingNotes((s) => {
        const next = new Set(s);
        next.delete(topicId);
        return next;
      });
    }
  }, []);

  // ── Fetch chunks for a note ──
  const fetchChunks = useCallback(async (noteId: string, force = false) => {
    if (!force) {
      let exists = false;
      setChunksMap((m) => {
        exists = !!m[noteId];
        return m;
      });
      if (exists) return;
    }
    setLoadingChunks((s) => new Set(s).add(noteId));
    try {
      const res = await fetch(`/api/notes/${noteId}/chunks`);
      if (res.ok) {
        const data: Chunk[] = await res.json();
        setChunksMap((m) => ({ ...m, [noteId]: data }));
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingChunks((s) => {
        const next = new Set(s);
        next.delete(noteId);
        return next;
      });
    }
  }, []);

  // ── Toggle topic expand ──
  const toggleTopic = (topicId: string) => {
    setExpandedTopics((s) => {
      const next = new Set(s);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
        fetchNotes(topicId);
      }
      return next;
    });
  };

  // ── Toggle note expand ──
  const toggleNote = (noteId: string) => {
    setExpandedNotes((s) => {
      const next = new Set(s);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
        fetchChunks(noteId);
      }
      return next;
    });
  };

  // ── Select chunk ──
  const handleChunkSelect = (
    chunk: Chunk,
    noteId: string,
    noteName: string,
    topicId: string,
    topicName: string
  ) => {
    setSelectedChunkId(chunk.id);
    setSelectedChunkMeta({ topicId, topicName, noteId, noteName });
    setIsEditing(false);
    setEditorState(null);
    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  // ── Save chunk content ──
  const handleSave = async () => {
    if (!editorState || !selectedChunkId) return;
    setIsSaving(true);
    try {
      const md = lexicalToMarkdown(editorState);
      await updateChunkContent(selectedChunkId, editorState, md);
      // Update local cache
      if (selectedChunkMeta) {
        setChunksMap((m) => {
          const noteChunks = m[selectedChunkMeta.noteId];
          if (!noteChunks) return m;
          return {
            ...m,
            [selectedChunkMeta.noteId]: noteChunks.map((c) =>
              c.id === selectedChunkId
                ? { ...c, contentJson: editorState, contentMd: md }
                : c
            ),
          };
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save chunk:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Invalidate cache helpers ──
  const invalidateNotes = (topicId: string) => {
    fetchNotes(topicId, true);
  };

  const invalidateChunks = (noteId: string) => {
    fetchChunks(noteId, true);
  };

  // ── Tree sidebar ──
  const treeSidebar = (
    <div
      className={`flex flex-col min-h-0 h-full border-r bg-muted/20 transition-all duration-200 z-20 ${
        sidebarCollapsed
          ? 'w-0 overflow-hidden border-r-0'
          : 'w-[280px] min-w-[280px]'
      } max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-lg max-md:bg-background`}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Materials
        </span>
        <div className="flex items-center gap-1">
          <AddTopicDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="New topic"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSidebarCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto py-1">
        {topics.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No topics yet
          </div>
        ) : (
          topics.map((t) => {
            const isExpanded = expandedTopics.has(t.id);
            const isTopicTracked = topicTrackedMap[t.id] ?? false;
            const topicNotes = notesMap[t.id] ?? [];
            const isLoadingTopicNotes = loadingNotes.has(t.id);

            return (
              <div key={t.id}>
                {/* Topic row */}
                <div className="group flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <button
                    onClick={() => toggleTopic(t.id)}
                    className="flex items-center gap-1 flex-1 min-w-0 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium truncate">
                      📚 {t.name}
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isTopicTracked && <Blinker />}
                    <EditDialog
                      entityType="topic"
                      currentName={t.name}
                      currentDescription={t.description}
                      onSave={async (name, desc) => {
                        await updateTopic(t.id, name, desc);
                      }}
                      trigger={
                        <button className="text-muted-foreground hover:text-primary p-0.5">
                          <Pencil size={10} />
                        </button>
                      }
                    />
                    <button
                      onClick={() => {
                        if (
                          confirm('Delete this topic and all its notes/chunks?')
                        ) {
                          deleteTopic(t.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                    >
                      <Trash2 size={10} />
                    </button>
                    <TrackingButton
                      entityType="topic"
                      entityId={t.id}
                      isTracked={isTopicTracked}
                      compact
                    />
                  </div>
                </div>

                {/* Notes under topic */}
                {isExpanded && (
                  <div className="ml-3 border-l border-border/50">
                    {isLoadingTopicNotes ? (
                      <div className="flex items-center gap-1 px-3 py-2">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Loading…
                        </span>
                      </div>
                    ) : topicNotes.length === 0 ? (
                      <div className="px-3 py-2 text-[10px] text-muted-foreground">
                        No notes
                      </div>
                    ) : (
                      topicNotes.map((n) => {
                        const isNoteExpanded = expandedNotes.has(n.id);
                        const noteChunks = chunksMap[n.id] ?? [];
                        const isLoadingNoteChunks = loadingChunks.has(n.id);

                        return (
                          <div key={n.id}>
                            {/* Note row */}
                            <div className="group flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                              <button
                                onClick={() => toggleNote(n.id)}
                                className="flex items-center gap-1 flex-1 min-w-0 text-left"
                              >
                                {isNoteExpanded ? (
                                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                )}
                                <span className="text-xs truncate">
                                  📘 {n.name}
                                </span>
                              </button>
                              <div
                                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EditDialog
                                  entityType="note"
                                  currentName={n.name}
                                  currentDescription={n.description}
                                  onSave={async (name, desc) => {
                                    await updateNote(n.id, t.id, name, desc);
                                  }}
                                  trigger={
                                    <button className="text-muted-foreground hover:text-primary p-0.5">
                                      <Pencil size={10} />
                                    </button>
                                  }
                                />
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        'Delete this note and all its chunks?'
                                      )
                                    ) {
                                      deleteNote(n.id, t.id);
                                      invalidateNotes(t.id);
                                    }
                                  }}
                                  className="text-muted-foreground hover:text-destructive p-0.5"
                                >
                                  <Trash2 size={10} />
                                </button>
                                <TrackingButton
                                  entityType="note"
                                  entityId={n.id}
                                  topicId={t.id}
                                  isTracked={false}
                                  compact
                                />
                              </div>
                            </div>

                            {/* Chunks under note */}
                            {isNoteExpanded && (
                              <div className="ml-3 border-l border-border/50">
                                {isLoadingNoteChunks ? (
                                  <div className="flex items-center gap-1 px-3 py-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">
                                      Loading…
                                    </span>
                                  </div>
                                ) : noteChunks.length === 0 ? (
                                  <div className="px-3 py-1.5 text-[10px] text-muted-foreground">
                                    No chunks
                                  </div>
                                ) : (
                                  noteChunks.map((c) => {
                                    const isTracked = trackedChunkIds.has(c.id);
                                    const isSelected = c.id === selectedChunkId;
                                    return (
                                      <div
                                        key={c.id}
                                        role="button"
                                        onClick={() =>
                                          handleChunkSelect(
                                            c,
                                            n.id,
                                            n.name,
                                            t.id,
                                            t.name
                                          )
                                        }
                                        className={`group flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 cursor-pointer ${
                                          isSelected
                                            ? 'bg-muted font-medium'
                                            : ''
                                        }`}
                                      >
                                        <span className="text-[11px] truncate flex items-center gap-1 flex-1 min-w-0">
                                          <Layers className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          {c.name}
                                        </span>
                                        <div
                                          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {isTracked && <Blinker />}
                                          <EditDialog
                                            entityType="chunk"
                                            currentName={c.name}
                                            currentDescription={c.description}
                                            onSave={async (name, desc) => {
                                              await updateChunk(
                                                c.id,
                                                n.id,
                                                t.id,
                                                name,
                                                desc
                                              );
                                            }}
                                            trigger={
                                              <button className="text-muted-foreground hover:text-primary p-0.5">
                                                <Pencil size={10} />
                                              </button>
                                            }
                                          />
                                          <button
                                            onClick={() => {
                                              if (
                                                confirm('Delete this chunk?')
                                              ) {
                                                deleteChunk(c.id, n.id, t.id);
                                                invalidateChunks(n.id);
                                              }
                                            }}
                                            className="text-muted-foreground hover:text-destructive p-0.5"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                          <TrackingButton
                                            entityType="chunk"
                                            entityId={c.id}
                                            topicId={t.id}
                                            noteId={n.id}
                                            isTracked={isTracked}
                                            compact
                                            contentLength={
                                              c.contentMd?.length ??
                                              c.description?.length ??
                                              0
                                            }
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                                {/* Add chunk button */}
                                <div className="px-2 py-1">
                                  <AddChunkDialog
                                    noteId={n.id}
                                    topicId={t.id}
                                    trigger={
                                      <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> New chunk
                                      </button>
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    {/* Add note button */}
                    <div className="px-2 py-1">
                      <AddNoteDialog
                        topicId={t.id}
                        trigger={
                          <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <Plus className="h-3 w-3" /> New note
                          </button>
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Main content ──
  const contentPanel = (
    <div className="flex flex-col min-h-0 h-full flex-1">
      {/* Content header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setSidebarCollapsed(false)}
              title="Show sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          {selectedChunk && selectedChunkMeta ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <span className="truncate">{selectedChunkMeta.topicName}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="truncate">{selectedChunkMeta.noteName}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="font-medium text-foreground truncate">
                {selectedChunk.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Select a chunk to view or edit
            </span>
          )}
        </div>
        {selectedChunk && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content body */}
      <div className="flex-1 overflow-y-auto">
        {selectedChunk ? (
          isEditing ? (
            <div className="h-full">
              <ChunkEditor
                initialValue={
                  selectedChunk.contentJson as SerializedEditorState | undefined
                }
                onChange={(state) => setEditorState(state)}
              />
            </div>
          ) : (
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
                  No content yet — click Edit to start writing.
                </p>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              Select a chunk from the sidebar to view or edit it
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-[calc(100vh-var(--header-height))] min-h-0">
      {treeSidebar}
      {contentPanel}
    </div>
  );
}
