'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
import type { TrackingItem, OutdatedChunk } from '@/lib/actions/tracking';
import { regenerateChunkQuestions } from '@/lib/actions/tracking';
import { notifyPassBalanceChanged } from '@/lib/pass-events';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ChunkRecallStats } from '@/app/api/chunks/[chunkId]/recall-stats/route';

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
  outdatedChunks: OutdatedChunk[];
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

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
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
  outdatedChunks: initialOutdatedChunks,
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

  // ── Outdated chunks ──
  const [outdatedChunks, setOutdatedChunks] = useState(initialOutdatedChunks);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [passError, setPassError] = useState<string | null>(null);
  // ── Entity selection (topic/note detail in right panel) ──
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'topic' | 'note';
    id: string;
    name: string;
    description: string;
    topicId?: string;
    topicName?: string;
  } | null>(null);

  const outdatedChunkMap = useMemo(
    () => new Map(outdatedChunks.map((c) => [c.chunkId, c])),
    [outdatedChunks]
  );

  const handleRegenerate = useCallback(
    (chunkId: string) => {
      setRegeneratingIds((prev) => new Set(prev).add(chunkId));
      regenerateChunkQuestions(chunkId)
        .then((result) => {
          if (result.status === 'success') {
            setOutdatedChunks((prev) =>
              prev.filter((c) => c.chunkId !== chunkId)
            );
            if (result.newBalance != null)
              notifyPassBalanceChanged(result.newBalance);
          } else if (result.status === 'insufficient_pass') {
            setPassError(
              `Not enough Pass (have ${result.balance}, need ${result.required}).`
            );
          } else if (result.status === 'error') {
            setPassError(result.message);
          }
        })
        .finally(() => {
          setRegeneratingIds((prev) => {
            const next = new Set(prev);
            next.delete(chunkId);
            return next;
          });
        });
    },
    []
  );

  // ── Chunk recall stats (fetched on chunk selection) ──
  const [chunkRecallStats, setChunkRecallStats] =
    useState<ChunkRecallStats | null>(null);

  useEffect(() => {
    if (!selectedChunkId) {
      setChunkRecallStats(null);
      return;
    }
    let cancelled = false;
    setChunkRecallStats(null);
    fetch(`/api/chunks/${selectedChunkId}/recall-stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setChunkRecallStats(data);
      })
      .catch(() => {
        if (!cancelled) setChunkRecallStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChunkId]);

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
  const toggleTopic = useCallback(
    (topicId: string) => {
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
    },
    [fetchNotes]
  );

  const toggleNote = useCallback(
    (noteId: string) => {
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
    },
    [fetchChunks]
  );

  // ── Select chunk ──
  const handleChunkSelect = (
    chunk: Chunk,
    topicId: string,
    topicName: string,
    noteId: string,
    noteName: string
  ) => {
    setSelectedEntity(null);
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
  const handleSave = useCallback(async () => {
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
  }, [selectedChunkMeta, editorState, fetchChunks, selectedChunkId]);

  // ── Invalidate cache helpers ──
  const invalidateNotes = useCallback(
    (topicId: string) => {
      fetchNotes(topicId, true);
    },
    [fetchNotes]
  );

  const invalidateChunks = useCallback(
    (noteId: string) => {
      fetchChunks(noteId, true);
    },
    [fetchChunks]
  );

  // ── Select topic (show detail in right panel) ──
  const handleTopicSelect = useCallback(
    (topic: Topic) => {
      setSelectedEntity({
        type: 'topic',
        id: topic.id,
        name: topic.name,
        description: topic.description,
      });
      setSelectedChunkId(null);
      setSelectedChunkMeta(null);
      setIsEditing(false);
      setEditorState(null);
      setExpandedTopics((prev) => {
        if (prev.has(topic.id)) return prev;
        const next = new Set(prev);
        next.add(topic.id);
        fetchNotes(topic.id);
        return next;
      });
    },
    [fetchNotes]
  );

  // ── Select note (show detail in right panel) ──
  const handleNoteSelect = useCallback(
    (note: Note, topicId: string, topicName: string) => {
      setSelectedEntity({
        type: 'note',
        id: note.id,
        name: note.name,
        description: note.description,
        topicId,
        topicName,
      });
      setSelectedChunkId(null);
      setSelectedChunkMeta(null);
      setIsEditing(false);
      setEditorState(null);
      setExpandedNotes((prev) => {
        if (prev.has(note.id)) return prev;
        const next = new Set(prev);
        next.add(note.id);
        fetchChunks(note.id);
        return next;
      });
    },
    [fetchChunks]
  );

  // ── Resolve currently chunk from maps ──
  const selectedChunk = useMemo(() => {
    if (!selectedChunkId || !selectedChunkMeta) return null;
    const chunks = chunksMap[selectedChunkMeta.noteId];
    return chunks?.find((c) => c.id === selectedChunkId) ?? null;
  }, [selectedChunkId, selectedChunkMeta, chunksMap]);

  // ── Tree sidebar ──
  const treeSidebar = useMemo(() => {
    return (
      <div
        className={`flex flex-col min-h-0 h-full rounded-[2rem] bg-muted/40 shadow-md transition-all duration-200 z-20 ${
          sidebarCollapsed
            ? 'w-0 overflow-hidden'
            : 'w-[280px] min-w-[280px]'
        } max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-lg max-md:bg-background`}
      >
        {/* Sidebar header */}
        <div className="flex flex-col gap-2 px-3 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              Materials Editor
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSidebarCollapsed(true)}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
          <AddTopicDialog
            trigger={
              <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Topic
              </Button>
            }
          />
        </div>

        {/* Tree content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-1.5 space-y-1">
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
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm rounded-xl mx-1.5 ${
                    selectedEntity?.type === 'topic' && selectedEntity.id === t.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-background/60'
                  }`}
                  onClick={() => handleTopicSelect(t)}
                >
                  <button
                    className="shrink-0 p-0.5 rounded hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTopic(t.id);
                    }}
                  >
                    {isTopicExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="flex-1 truncate font-medium">
                    {t.name}
                  </span>
                </div>

                {/* Notes under topic */}
                {isTopicExpanded && (
                  <div className="ml-5 py-1 space-y-0.5">
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
                          <div
                            className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer text-sm rounded-xl ${
                              selectedEntity?.type === 'note' && selectedEntity.id === n.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-background/60'
                            }`}
                            onClick={() => handleNoteSelect(n, t.id, t.name)}
                          >
                            <button
                              className="shrink-0 p-0.5 rounded hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNote(n.id);
                              }}
                            >
                              {isNoteExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <span className="flex-1 truncate">
                              {n.name}
                            </span>
                          </div>

                          {/* Chunks under note */}
                          {isNoteExpanded && (
                            <div className="ml-5 py-1 space-y-0.5">
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
                                    className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer text-sm rounded-xl ${
                                      isSelected
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-background/60'
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
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        outdatedChunkMap.has(c.id)
                                          ? 'bg-amber-500'
                                          : 'bg-current opacity-40'
                                      }`}
                                    />
                                    <span className="flex-1 truncate">
                                      {c.name}
                                    </span>
                                  </div>
                                );
                              })}

                            </div>
                          )}
                        </div>
                      );
                    })}

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
    selectedEntity,
    sidebarCollapsed,
    outdatedChunkMap,
    toggleNote,
    toggleTopic,
    handleTopicSelect,
    handleNoteSelect,
  ]);

  // ── Content panel ──
  const contentPanel = useMemo(() => {
    // ── Case 1: Chunk selected → editor view ──
    if (selectedChunk && selectedChunkMeta) {
      const draft = loadDraft(selectedChunk.id);
      const editorInitialValue =
        isEditing && draft
          ? draft
          : (selectedChunk.contentJson as SerializedEditorState | undefined);

      return (
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          {/* ── Top card: chunk info, recall stats, actions ── */}
          <div className="shrink-0 rounded-[2rem] bg-muted/40 shadow-md px-5 py-4 space-y-3">
            {/* Row 1: Breadcrumb + chunk actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <span className="truncate max-w-[160px]">{selectedChunkMeta.topicName}</span>
                <AddNoteDialog
                  topicId={selectedChunkMeta.topicId}
                  onSuccess={() => invalidateNotes(selectedChunkMeta.topicId)}
                  trigger={
                    <button className="shrink-0 p-0.5 rounded hover:bg-muted" title="Add note to this topic">
                      <Plus className="h-3 w-3" />
                    </button>
                  }
                />
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate max-w-[160px]">{selectedChunkMeta.noteName}</span>
                <AddChunkDialog
                  noteId={selectedChunkMeta.noteId}
                  topicId={selectedChunkMeta.topicId}
                  onSuccess={() => invalidateChunks(selectedChunkMeta.noteId)}
                  trigger={
                    <button className="shrink-0 p-0.5 rounded hover:bg-muted" title="Add chunk to this note">
                      <Plus className="h-3 w-3" />
                    </button>
                  }
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <TrackingButton
                  entityType="chunk"
                  entityId={selectedChunk.id}
                  topicId={selectedChunkMeta.topicId}
                  noteId={selectedChunkMeta.noteId}
                  isTracked={trackedChunkIds.has(selectedChunk.id)}
                  compact
                />
                <EditDialog
                  entityType="chunk"
                  currentName={selectedChunk.name}
                  currentDescription={selectedChunk.description}
                  onSave={async (name, desc) => {
                    await updateChunk(selectedChunk.id, selectedChunkMeta.noteId, selectedChunkMeta.topicId, name, desc);
                    invalidateChunks(selectedChunkMeta.noteId);
                  }}
                  trigger={
                    <button className="p-1 rounded-lg hover:bg-background/60" title="Edit chunk metadata">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  }
                />
                <button
                  className="p-1 rounded-lg hover:bg-destructive/10"
                  title="Delete chunk"
                  onClick={async () => {
                    if (confirm(`Delete chunk "${selectedChunk.name}"?`)) {
                      await deleteChunk(selectedChunk.id, selectedChunkMeta.noteId, selectedChunkMeta.topicId);
                      invalidateChunks(selectedChunkMeta.noteId);
                      setSelectedChunkId(null);
                      setSelectedChunkMeta(null);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>

            {/* Row 2: Title + metadata */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold truncate">{selectedChunk.name}</h2>
                {selectedChunk.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{selectedChunk.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[0.7rem] text-muted-foreground pt-1">
                <span>
                  {selectedChunk.contentMd ? `${selectedChunk.contentMd.split(/\s+/).length} words` : '0 words'}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  {selectedChunk.contentMd
                    ? `${Math.max(1, Math.ceil(selectedChunk.contentMd.split(/\s+/).length / 200))} min read`
                    : '0 min read'}
                </span>
              </div>
            </div>

            {/* Recall stats */}
            {chunkRecallStats && (
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { label: 'Questions', value: chunkRecallStats.totalQuestions, color: 'text-foreground' },
                  { label: 'Due', value: chunkRecallStats.dueCount, color: chunkRecallStats.dueCount > 0 ? 'text-sr-lapsed' : 'text-foreground' },
                  { label: 'Reps', value: chunkRecallStats.totalReps, color: 'text-foreground' },
                  { label: 'Lapses', value: chunkRecallStats.totalLapses, color: chunkRecallStats.totalLapses > 0 ? 'text-amber-500' : 'text-foreground' },
                  { label: 'Stability', value: chunkRecallStats.avgStability.toFixed(1), color: 'text-secondary-foreground' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-1.5 rounded-xl bg-background/60 px-2.5 py-1.5">
                    <span className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
                    <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
                  </div>
                ))}
                {chunkRecallStats.lastReview && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-background/60 px-2.5 py-1.5">
                    <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider font-medium">
                      Last review {formatRelativeDate(chunkRecallStats.lastReview)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Outdate banner */}
            {outdatedChunkMap.has(selectedChunk.id) && (() => {
              const info = outdatedChunkMap.get(selectedChunk.id)!;
              const isRegen = regeneratingIds.has(selectedChunk.id);
              return (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="flex-1 text-amber-800 dark:text-amber-200">
                    {info.reason === 'content_changed'
                      ? 'Content changed since questions were generated.'
                      : `All ${info.retiredCount} question${info.retiredCount !== 1 ? 's' : ''} retired after reaching the review limit.`}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 border-0"
                    disabled={isRegen}
                    onClick={() => handleRegenerate(selectedChunk.id)}
                  >
                    {isRegen ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Regenerate
                  </Button>
                </div>
              );
            })()}
          </div>

          {/* ── Editor toolbar ── */}
          <div className="flex items-center justify-end px-1 shrink-0">
            {hasDraft && !isEditing && (
              <span className="text-xs text-amber-500 font-medium mr-auto">Unsaved draft</span>
            )}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="bg-muted/50 hover:bg-muted rounded-xl"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Content
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setIsEditing(false);
                    setEditorState(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSave}
                  disabled={isSaving || !editorState}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {/* ── Editor / viewer ── */}
          <div className="flex-1 min-h-0 rounded-[2rem] bg-card overflow-hidden shadow-md">
            {isEditing ? (
              <div className="h-full overflow-y-auto">
                <ChunkEditor
                  key={`${selectedChunk.id}-editing`}
                  initialValue={editorInitialValue}
                  onChange={handleEditorChange}
                  editable
                />
              </div>
            ) : selectedChunk.contentJson ? (
              <div className="h-full overflow-y-auto">
                <ChunkEditor
                  key={`${selectedChunk.id}-readonly`}
                  initialValue={selectedChunk.contentJson as SerializedEditorState}
                  editable={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm italic">
                  No content yet. Click Edit Content to start writing.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Case 2: Topic or Note selected → detail view ──
    if (selectedEntity) {
      const isTopic = selectedEntity.type === 'topic';
      const noteCount = isTopic ? (notesMap[selectedEntity.id]?.length ?? 0) : 0;
      const chunkCount = !isTopic ? (chunksMap[selectedEntity.id]?.length ?? 0) : 0;

      return (
        <div className="flex-1 flex items-center justify-center rounded-[2rem] bg-muted/30 shadow-md">
          <div className="w-full max-w-md p-8 space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isTopic ? 'bg-primary/10' : 'bg-blue-500/10'}`}>
                {isTopic
                  ? <BookOpen className="h-7 w-7 text-primary" />
                  : <Layers className="h-7 w-7 text-blue-500" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedEntity.name}</h2>
                {!isTopic && selectedEntity.topicName && (
                  <p className="text-xs text-muted-foreground mt-1">in {selectedEntity.topicName}</p>
                )}
              </div>
            </div>

            {selectedEntity.description && (
              <p className="text-sm text-muted-foreground text-center leading-relaxed">{selectedEntity.description}</p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {isTopic && <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>}
              {!isTopic && <span>{chunkCount} chunk{chunkCount !== 1 ? 's' : ''}</span>}
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <TrackingButton
                entityType={selectedEntity.type}
                entityId={selectedEntity.id}
                {...(!isTopic && selectedEntity.topicId ? { topicId: selectedEntity.topicId } : {})}
                isTracked={trackedChunkIds.has(selectedEntity.id)}
              />
              {isTopic ? (
                <AddNoteDialog
                  topicId={selectedEntity.id}
                  onSuccess={() => invalidateNotes(selectedEntity.id)}
                  trigger={
                    <Button variant="ghost" size="sm" className="bg-background/60 hover:bg-background rounded-xl">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add note
                    </Button>
                  }
                />
              ) : (
                <AddChunkDialog
                  noteId={selectedEntity.id}
                  topicId={selectedEntity.topicId!}
                  onSuccess={() => invalidateChunks(selectedEntity.id)}
                  trigger={
                    <Button variant="ghost" size="sm" className="bg-background/60 hover:bg-background rounded-xl">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add chunk
                    </Button>
                  }
                />
              )}
              <EditDialog
                entityType={selectedEntity.type}
                currentName={selectedEntity.name}
                currentDescription={selectedEntity.description}
                onSave={async (name, desc) => {
                  if (isTopic) {
                    await updateTopic(selectedEntity.id, name, desc);
                  } else {
                    await updateNote(selectedEntity.id, selectedEntity.topicId!, name, desc);
                    invalidateNotes(selectedEntity.topicId!);
                  }
                  setSelectedEntity((prev) => prev ? { ...prev, name, description: desc } : null);
                }}
                trigger={
                  <Button variant="ghost" size="sm" className="bg-background/60 hover:bg-background rounded-xl">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl"
                onClick={async () => {
                  const label = isTopic ? 'topic' : 'note';
                  const extra = isTopic ? ' and all its notes/chunks' : ' and all its chunks';
                  if (confirm(`Delete ${label} "${selectedEntity.name}"${extra}?`)) {
                    if (isTopic) {
                      await deleteTopic(selectedEntity.id);
                    } else {
                      await deleteNote(selectedEntity.id, selectedEntity.topicId!);
                      invalidateNotes(selectedEntity.topicId!);
                    }
                    setSelectedEntity(null);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── Case 3: Nothing selected ──
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground rounded-[2rem] bg-muted/30 shadow-md">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto opacity-30" />
          <p className="text-sm">Select an item from the tree to view details.</p>
        </div>
      </div>
    );
  }, [
    selectedChunk,
    selectedChunkMeta,
    selectedEntity,
    isEditing,
    isSaving,
    editorState,
    hasDraft,
    handleEditorChange,
    handleSave,
    invalidateNotes,
    invalidateChunks,
    outdatedChunkMap,
    regeneratingIds,
    handleRegenerate,
    chunkRecallStats,
    trackedChunkIds,
    notesMap,
    chunksMap,
  ]);

  return (
    <>
      <div className="relative flex gap-5 h-[calc(100vh-var(--header-height))] min-h-0 p-5">
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 self-start mt-1 bg-muted/50 hover:bg-muted rounded-xl"
            onClick={() => setSidebarCollapsed(false)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        {treeSidebar}
        {contentPanel}
      </div>

      {/* Pass error dialog */}
      <Dialog
        open={!!passError}
        onOpenChange={(open) => {
          if (!open) setPassError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Not enough Pass</DialogTitle>
            <DialogDescription>
              {passError} Top up at billing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassError(null)}>
              Close
            </Button>
            <Button asChild>
              <a href="/dashboard/billing">Top up Pass</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
