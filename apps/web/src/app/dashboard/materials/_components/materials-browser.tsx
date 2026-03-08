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
import ChunkEditor from '@/components/lexical-editor/ChunkEditor';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import { updateChunkContent } from '@/lib/actions/chunks';
import { deleteTopic, deleteNote, deleteChunk } from '@/lib/actions/delete';
import { updateTopic, updateNote, updateChunk } from '@/lib/actions/update';
import EditDialog from '@/components/edit-dialog';
import TrackingButton from '@/components/tracking-button';
import AddNoteDialog from '@/components/add-note-dialog';
import { AddTopicDialog } from './add-topic-dialog';
import AddChunkDialog from './add-chunk-dialog';
import type { TrackingItem } from '@/lib/actions/tracking';

// ── Types ──

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface Note {
  id: string;
  name: string;
  description: string;
  topicId: string | null;
}

interface Chunk {
  id: string;
  name: string;
  description: string;
  noteId: string | null;
  contentJson: unknown;
  contentMd: string | null;
}

interface MaterialsBrowserProps {
  topics: Topic[];
  trackedItems: TrackingItem[];
  topicTrackedMap: Record<string, Set<string>>;
}

// ── localStorage helpers ──

const DRAFT_KEY_PREFIX = 'temar_draft_';

function saveDraft(chunkId: string, state: SerializedEditorState) {
  try {
    localStorage.setItem(
      `${DRAFT_KEY_PREFIX}${chunkId}`,
      JSON.stringify(state)
    );
  } catch {
    // silently ignore quota errors
  }
}

function loadDraft(chunkId: string): SerializedEditorState | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${chunkId}`);
    return raw ? (JSON.parse(raw) as SerializedEditorState) : null;
  } catch {
    return null;
  }
}

function clearDraft(chunkId: string) {
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${chunkId}`);
  } catch {
    // ignore
  }
}

// ── Component ──

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
  const [hasDraft, setHasDraft] = useState(false);

  // ── Sidebar ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Tracked chunk IDs set for quick lookup ──
  const trackedChunkIds = useMemo(
    () => new Set(trackedItems.map((item) => item.chunkId)),
    [trackedItems]
  );

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

  // ── Toggle helpers ──
  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
        fetchNotes(topicId);
      }
      return next;
    });
  };

  const toggleNote = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
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
    topicId: string,
    topicName: string,
    noteId: string,
    noteName: string
  ) => {
    setSelectedChunkId(chunk.id);
    setSelectedChunkMeta({ topicId, topicName, noteId, noteName });
    setIsEditing(false);
    setEditorState(null);

    // Check for unsaved draft
    const draft = loadDraft(chunk.id);
    setHasDraft(!!draft);

    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  // ── Save draft on editor change ──
  const handleEditorChange = useCallback(
    (state: SerializedEditorState) => {
      setEditorState(state);
      if (selectedChunkId) {
        saveDraft(selectedChunkId, state);
        setHasDraft(true);
      }
    },
    [selectedChunkId]
  );

  // ── Save chunk content ──
  const handleSave = async () => {
    if (!selectedChunkId || !editorState) return;
    setIsSaving(true);
    try {
      const md = lexicalToMarkdown(editorState);
      await updateChunkContent(selectedChunkId, editorState, md);
      clearDraft(selectedChunkId);
      setHasDraft(false);
      setIsEditing(false);

      // Refresh chunk data in the map
      if (selectedChunkMeta) {
        fetchChunks(selectedChunkMeta.noteId, true);
      }
    } catch (err) {
      console.error('Save failed:', err);
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

  // ── Resolve currently selected chunk from maps ──
  const selectedChunk = useMemo(() => {
    if (!selectedChunkId || !selectedChunkMeta) return null;
    const chunks = chunksMap[selectedChunkMeta.noteId];
    return chunks?.find((c) => c.id === selectedChunkId) ?? null;
  }, [selectedChunkId, selectedChunkMeta, chunksMap]);

  // ── Tree sidebar ──
  const treeSidebar = useMemo(() => {
    return (
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
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSidebarCollapsed(true)}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tree content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {topics.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <p>No topics yet.</p>
              <p className="mt-1">Click + to create your first topic.</p>
            </div>
          )}

          {topics.map((t) => {
            const isTopicExpanded = expandedTopics.has(t.id);
            const notes = notesMap[t.id] ?? [];
            const isLoadingNotes = loadingNotes.has(t.id);

            return (
              <div key={t.id}>
                {/* Topic row */}
                <div className="group flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer text-sm">
                  <button
                    className="shrink-0 p-0.5 rounded hover:bg-muted"
                    onClick={() => toggleTopic(t.id)}
                  >
                    {isTopicExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span
                    className="flex-1 truncate font-medium"
                    onClick={() => toggleTopic(t.id)}
                  >
                    {t.name}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <TrackingButton
                      entityType="topic"
                      entityId={t.id}
                      isTracked={trackedChunkIds.has(t.id)}
                      compact
                    />
                    <EditDialog
                      entityType="topic"
                      currentName={t.name}
                      currentDescription={t.description}
                      onSave={async (name, desc) => {
                        await updateTopic(t.id, name, desc);
                      }}
                      trigger={
                        <button className="p-0.5 rounded hover:bg-muted">
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                      }
                    />
                    <button
                      className="p-0.5 rounded hover:bg-destructive/10"
                      onClick={async () => {
                        if (
                          confirm(
                            `Delete topic "${t.name}" and all its notes/chunks?`
                          )
                        ) {
                          await deleteTopic(t.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Notes under topic */}
                {isTopicExpanded && (
                  <div className="ml-4">
                    {isLoadingNotes && (
                      <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    )}

                    {!isLoadingNotes && notes.length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        No notes yet
                      </div>
                    )}

                    {notes.map((n) => {
                      const isNoteExpanded = expandedNotes.has(n.id);
                      const chunks = chunksMap[n.id] ?? [];
                      const isLoadingChunksForNote = loadingChunks.has(n.id);

                      return (
                        <div key={n.id}>
                          {/* Note row */}
                          <div className="group flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer text-sm">
                            <button
                              className="shrink-0 p-0.5 rounded hover:bg-muted"
                              onClick={() => toggleNote(n.id)}
                            >
                              {isNoteExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <span
                              className="flex-1 truncate"
                              onClick={() => toggleNote(n.id)}
                            >
                              {n.name}
                            </span>
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              <TrackingButton
                                entityType="note"
                                entityId={n.id}
                                topicId={t.id}
                                isTracked={trackedChunkIds.has(n.id)}
                                compact
                              />
                              <EditDialog
                                entityType="note"
                                currentName={n.name}
                                currentDescription={n.description}
                                onSave={async (name, desc) => {
                                  await updateNote(n.id, t.id, name, desc);
                                  invalidateNotes(t.id);
                                }}
                                trigger={
                                  <button className="p-0.5 rounded hover:bg-muted">
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                }
                              />
                              <button
                                className="p-0.5 rounded hover:bg-destructive/10"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Delete note "${n.name}" and all its chunks?`
                                    )
                                  ) {
                                    await deleteNote(n.id, t.id);
                                    invalidateNotes(t.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          </div>

                          {/* Chunks under note */}
                          {isNoteExpanded && (
                            <div className="ml-4">
                              {isLoadingChunksForNote && (
                                <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Loading...
                                </div>
                              )}

                              {!isLoadingChunksForNote &&
                                chunks.length === 0 && (
                                  <div className="px-2 py-1 text-xs text-muted-foreground">
                                    No chunks yet
                                  </div>
                                )}

                              {chunks.map((c) => {
                                const isSelected = selectedChunkId === c.id;
                                return (
                                  <div
                                    key={c.id}
                                    className={`group flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded-sm ${
                                      isSelected
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() =>
                                      handleChunkSelect(
                                        c,
                                        t.id,
                                        t.name,
                                        n.id,
                                        n.name
                                      )
                                    }
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
                                    <span className="flex-1 truncate">
                                      {c.name}
                                    </span>
                                    <div className="hidden group-hover:flex items-center gap-0.5">
                                      <TrackingButton
                                        entityType="chunk"
                                        entityId={c.id}
                                        topicId={t.id}
                                        noteId={n.id}
                                        isTracked={trackedChunkIds.has(c.id)}
                                        compact
                                      />
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
                                          invalidateChunks(n.id);
                                        }}
                                        trigger={
                                          <button className="p-0.5 rounded hover:bg-muted">
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                          </button>
                                        }
                                      />
                                      <button
                                        className="p-0.5 rounded hover:bg-destructive/10"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (
                                            confirm(`Delete chunk "${c.name}"?`)
                                          ) {
                                            await deleteChunk(c.id, n.id, t.id);
                                            invalidateChunks(n.id);
                                            if (selectedChunkId === c.id) {
                                              setSelectedChunkId(null);
                                              setSelectedChunkMeta(null);
                                            }
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Add chunk button */}
                              <AddChunkDialog
                                noteId={n.id}
                                topicId={t.id}
                                trigger={
                                  <button className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground w-full">
                                    <Plus className="h-3 w-3" />
                                    Add chunk
                                  </button>
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add note button */}
                    <AddNoteDialog
                      topicId={t.id}
                      trigger={
                        <button className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground w-full">
                          <Plus className="h-3 w-3" />
                          Add note
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [
    topics,
    expandedTopics,
    expandedNotes,
    notesMap,
    chunksMap,
    loadingNotes,
    loadingChunks,
    selectedChunkId,
    sidebarCollapsed,
    trackedChunkIds,
  ]);

  // ── Content panel ──
  const contentPanel = useMemo(() => {
    if (!selectedChunk || !selectedChunkMeta) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <BookOpen className="h-12 w-12 mx-auto opacity-30" />
            <p className="text-sm">
              Select a chunk from the tree to view or edit its content.
            </p>
            {sidebarCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeft className="h-4 w-4 mr-2" />
                Show sidebar
              </Button>
            )}
          </div>
        </div>
      );
    }

    const draft = loadDraft(selectedChunk.id);
    const editorInitialValue =
      isEditing && draft
        ? draft
        : (selectedChunk.contentJson as SerializedEditorState | undefined);

    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Content header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="text-xs text-muted-foreground truncate">
              {selectedChunkMeta.topicName} / {selectedChunkMeta.noteName}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasDraft && !isEditing && (
              <span className="text-xs text-amber-500 font-medium">
                Unsaved draft
              </span>
            )}
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditorState(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !editorState}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Chunk title */}
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{selectedChunk.name}</h2>
          {selectedChunk.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedChunk.description}
            </p>
          )}
        </div>

        {/* Editor / Read-only content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isEditing ? (
            <div className="h-full">
              <ChunkEditor
                key={`${selectedChunk.id}-editing`}
                initialValue={editorInitialValue}
                onChange={handleEditorChange}
              />
            </div>
          ) : (
            <div className="px-4 py-3">
              {selectedChunk.contentMd ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {selectedChunk.contentMd}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No content yet. Click Edit to start writing.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    selectedChunk,
    selectedChunkMeta,
    isEditing,
    isSaving,
    editorState,
    sidebarCollapsed,
    hasDraft,
    handleEditorChange,
  ]);

  return (
    <div className="relative flex h-[calc(100vh-var(--header-height))] min-h-0">
      {treeSidebar}
      {contentPanel}
    </div>
  );
}
