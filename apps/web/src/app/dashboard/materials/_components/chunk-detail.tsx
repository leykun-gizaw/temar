'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  RefreshCw,
  Brain,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SerializedEditorState } from 'lexical';
import ChunkEditor from '@/components/lexical-editor/ChunkEditor';
import { lexicalToMarkdown } from '@/components/lexical-editor/utils/serialize';
import { updateChunkContent } from '@/lib/actions/chunks';
import { updateChunk } from '@/lib/actions/update';
import { deleteChunk } from '@/lib/actions/delete';
import EditDialog from '@/components/edit-dialog';
import TrackingButton from '@/components/tracking-button';
import AddNoteDialog from '@/components/add-note-dialog';
import AddChunkDialog from './add-chunk-dialog';
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
import type { ChunkRecallStats } from '@/app/api/chunks/[chunkId]/recall-stats/route';
import type { OutdatedChunk } from '@/lib/actions/tracking';

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

// ── Types ──

interface ChunkDetailProps {
  chunk: {
    id: string;
    name: string;
    description: string;
    contentJson: unknown;
    contentMd: string | null;
  };
  topicId: string;
  topicName: string;
  noteId: string;
  noteName: string;
  isTracked: boolean;
  outdatedInfo: OutdatedChunk | null;
}

// ── Component ──

export default function ChunkDetail({
  chunk,
  topicId,
  topicName,
  noteId,
  noteName,
  isTracked,
  outdatedInfo: initialOutdatedInfo,
}: ChunkDetailProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ── Editor state ──
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // ── Outdated state ──
  const [outdatedInfo, setOutdatedInfo] = useState(initialOutdatedInfo);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // ── Chunk recall stats ──
  const [chunkRecallStats, setChunkRecallStats] =
    useState<ChunkRecallStats | null>(null);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft(chunk.id);
    setHasDraft(!!draft);
  }, [chunk.id]);

  // Fetch recall stats
  useEffect(() => {
    let cancelled = false;
    setChunkRecallStats(null);
    fetch(`/api/chunks/${chunk.id}/recall-stats`)
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
  }, [chunk.id]);

  // ── Save draft on editor change ──
  const handleEditorChange = useCallback(
    (state: SerializedEditorState) => {
      setEditorState(state);
      saveDraft(chunk.id, state);
      setHasDraft(true);
    },
    [chunk.id]
  );

  // ── Save chunk content ──
  const handleSave = useCallback(async () => {
    if (!editorState) return;
    setIsSaving(true);
    try {
      const md = lexicalToMarkdown(editorState);
      await updateChunkContent(chunk.id, editorState, md);
      clearDraft(chunk.id);
      setHasDraft(false);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [editorState, chunk.id, router]);

  // ── Regenerate questions ──
  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateChunkQuestions(chunk.id);
      if (result.status === 'success') {
        setOutdatedInfo(null);
        if (result.newBalance != null)
          notifyPassBalanceChanged(result.newBalance);
      } else if (result.status === 'insufficient_pass') {
        setPassError(
          `Not enough Pass (have ${result.balance}, need ${result.required}).`
        );
      } else if (result.status === 'error') {
        setPassError(result.message);
      }
    } finally {
      setIsRegenerating(false);
    }
  }, [chunk.id]);

  // ── Resolve editor initial value ──
  const draft = loadDraft(chunk.id);
  const editorInitialValue =
    isEditing && draft
      ? draft
      : (chunk.contentJson as SerializedEditorState | undefined);

  return (
    <>
      <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
        {/* ── Top card: chunk info, recall stats, actions ── */}
        <div className="shrink-0 rounded-[2rem] bg-muted/40 shadow-md px-5 py-4 space-y-3">
          {/* Row 1: Breadcrumb + chunk actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <span className="truncate max-w-[160px]">{topicName}</span>
              <AddNoteDialog
                topicId={topicId}
                onSuccess={() => router.refresh()}
                trigger={
                  <button
                    className="shrink-0 p-0.5 rounded hover:bg-muted"
                    title="Add note to this topic"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                }
              />
              <span className="text-muted-foreground/50">/</span>
              <span className="truncate max-w-[160px]">{noteName}</span>
              <AddChunkDialog
                noteId={noteId}
                topicId={topicId}
                onSuccess={() => router.refresh()}
                trigger={
                  <button
                    className="shrink-0 p-0.5 rounded hover:bg-muted"
                    title="Add chunk to this note"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                }
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <TrackingButton
                entityType="chunk"
                entityId={chunk.id}
                topicId={topicId}
                noteId={noteId}
                isTracked={isTracked}
                compact
              />
              <EditDialog
                entityType="chunk"
                currentName={chunk.name}
                currentDescription={chunk.description}
                onSave={async (name, desc) => {
                  await updateChunk(chunk.id, noteId, topicId, name, desc);
                  router.refresh();
                }}
                trigger={
                  <button
                    className="p-1 rounded-lg hover:bg-background/60"
                    title="Edit chunk metadata"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                }
              />
              <button
                className="p-1 rounded-lg hover:bg-destructive/10"
                title="Delete chunk"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>

          {/* Row 2: Title + metadata */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">{chunk.name}</h2>
              {chunk.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {chunk.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[0.7rem] text-muted-foreground pt-1">
              <span>
                {chunk.contentMd
                  ? `${chunk.contentMd.split(/\s+/).length} words`
                  : '0 words'}
              </span>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>
                {chunk.contentMd
                  ? `${Math.max(1, Math.ceil(chunk.contentMd.split(/\s+/).length / 200))} min read`
                  : '0 min read'}
              </span>
            </div>
          </div>

          {/* Recall stats */}
          {chunkRecallStats && (
            <div className="flex items-center gap-3 flex-wrap">
              {[
                {
                  label: 'Questions',
                  value: chunkRecallStats.totalQuestions,
                  color: 'text-foreground',
                },
                {
                  label: 'Due',
                  value: chunkRecallStats.dueCount,
                  color:
                    chunkRecallStats.dueCount > 0
                      ? 'text-sr-lapsed'
                      : 'text-foreground',
                },
                {
                  label: 'Reps',
                  value: chunkRecallStats.totalReps,
                  color: 'text-foreground',
                },
                {
                  label: 'Lapses',
                  value: chunkRecallStats.totalLapses,
                  color:
                    chunkRecallStats.totalLapses > 0
                      ? 'text-amber-500'
                      : 'text-foreground',
                },
                {
                  label: 'Stability',
                  value: chunkRecallStats.avgStability.toFixed(1),
                  color: 'text-secondary-foreground',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-1.5 rounded-xl bg-background/60 px-2.5 py-1.5"
                >
                  <span
                    className={`text-sm font-bold tabular-nums ${stat.color}`}
                  >
                    {stat.value}
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
              {chunkRecallStats.lastReview && (
                <div className="flex items-center gap-1.5 rounded-xl bg-background/60 px-2.5 py-1.5">
                  <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider font-medium">
                    Last review{' '}
                    {formatRelativeDate(chunkRecallStats.lastReview)}
                  </span>
                </div>
              )}
              <Link
                href={`/dashboard/reviews?topicId=${topicId}&noteId=${noteId}`}
                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1.5 text-primary hover:bg-primary/20 transition-colors"
              >
                <Brain className="h-3 w-3" />
                <span className="text-[0.6rem] uppercase tracking-wider font-bold">
                  View Questions
                </span>
              </Link>
            </div>
          )}

          {/* Outdated banner */}
          {outdatedInfo && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="flex-1 text-amber-800 dark:text-amber-200">
                {outdatedInfo.reason === 'content_changed'
                  ? 'Content changed since questions were generated.'
                  : `All ${outdatedInfo.retiredCount} question${outdatedInfo.retiredCount !== 1 ? 's' : ''} retired after reaching the review limit.`}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 border-0"
                disabled={isRegenerating}
                onClick={handleRegenerate}
              >
                {isRegenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Regenerate
              </Button>
            </div>
          )}
        </div>

        {/* ── Editor toolbar ── */}
        <div className="flex items-center justify-end px-1 shrink-0">
          {hasDraft && !isEditing && (
            <span className="text-xs text-amber-500 font-medium mr-auto">
              Unsaved draft
            </span>
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

        {/* ── Editor / viewer ── */}
        <div className="flex-1 min-h-0 rounded-[2rem] bg-card overflow-hidden shadow-md">
          {isEditing ? (
            <div className="h-full overflow-y-auto">
              <ChunkEditor
                key={`${chunk.id}-editing`}
                initialValue={editorInitialValue}
                onChange={handleEditorChange}
                editable
              />
            </div>
          ) : chunk.contentJson ? (
            <div className="h-full overflow-y-auto">
              <ChunkEditor
                key={`${chunk.id}-readonly`}
                initialValue={
                  chunk.contentJson as SerializedEditorState
                }
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chunk &ldquo;{chunk.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chunk and all its recall items,
              review logs, and generated questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deleteChunk(chunk.id, noteId, topicId);
                router.push(`/dashboard/materials/${topicId}/${noteId}`);
                router.refresh();
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
