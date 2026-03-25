'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Layers,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { AddTopicDialog } from './add-topic-dialog';
import type { OutdatedChunk } from '@/lib/actions/tracking';

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

interface TreeSidebarProps {
  topics: Topic[];
  outdatedChunks: OutdatedChunk[];
}

export default function TreeSidebar({
  topics,
  outdatedChunks,
}: TreeSidebarProps) {
  const router = useRouter();
  const params = useParams<{
    topicId?: string;
    noteId?: string;
    chunkId?: string;
  }>();

  // ── Tree state ──
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notesMap, setNotesMap] = useState<Record<string, Note[]>>({});
  const [chunksMap, setChunksMap] = useState<Record<string, Chunk[]>>({});
  const [loadingNotes, setLoadingNotes] = useState<Set<string>>(new Set());
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());

  // ── Sidebar ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const outdatedChunkMap = useMemo(
    () => new Map(outdatedChunks.map((c) => [c.chunkId, c])),
    [outdatedChunks]
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

  // ── Navigation handlers ──
  const handleTopicSelect = useCallback(
    (topic: Topic) => {
      router.push(`/dashboard/materials/${topic.id}`);
      // Auto-expand the topic in the tree
      setExpandedTopics((prev) => {
        if (prev.has(topic.id)) return prev;
        const next = new Set(prev);
        next.add(topic.id);
        fetchNotes(topic.id);
        return next;
      });
    },
    [router, fetchNotes]
  );

  const handleNoteSelect = useCallback(
    (note: Note, topicId: string) => {
      router.push(`/dashboard/materials/${topicId}/${note.id}`);
      // Auto-expand the note in the tree
      setExpandedNotes((prev) => {
        if (prev.has(note.id)) return prev;
        const next = new Set(prev);
        next.add(note.id);
        fetchChunks(note.id);
        return next;
      });
    },
    [router, fetchChunks]
  );

  const handleChunkSelect = useCallback(
    (chunkId: string, topicId: string, noteId: string) => {
      router.push(`/dashboard/materials/${topicId}/${noteId}/${chunkId}`);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    },
    [router]
  );

  return (
    <>
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
            const isTopicSelected =
              params.topicId === t.id && !params.noteId && !params.chunkId;

            return (
              <div key={t.id}>
                {/* Topic row */}
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm rounded-xl mx-1.5 ${
                    isTopicSelected
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
                      const isNoteSelected =
                        params.noteId === n.id && !params.chunkId;

                      return (
                        <div key={n.id}>
                          {/* Note row */}
                          <div
                            className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer text-sm rounded-xl ${
                              isNoteSelected
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-background/60'
                            }`}
                            onClick={() => handleNoteSelect(n, t.id)}
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
                                const isChunkSelected = params.chunkId === c.id;

                                return (
                                  <div
                                    key={c.id}
                                    className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer text-sm rounded-xl ${
                                      isChunkSelected
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-background/60'
                                    }`}
                                    onClick={() =>
                                      handleChunkSelect(c.id, t.id, n.id)
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
    </>
  );
}
