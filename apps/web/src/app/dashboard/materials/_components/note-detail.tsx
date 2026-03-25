'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
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
import TrackingButton from '@/components/tracking-button';
import EditDialog from '@/components/edit-dialog';
import AddChunkDialog from './add-chunk-dialog';
import { updateNote } from '@/lib/actions/update';
import { deleteNote } from '@/lib/actions/delete';

interface NoteDetailProps {
  note: {
    id: string;
    name: string;
    description: string;
  };
  topicId: string;
  topicName: string;
  chunkCount: number;
  isTracked: boolean;
}

export default function NoteDetail({
  note,
  topicId,
  topicName,
  chunkCount,
  isTracked,
}: NoteDetailProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex-1 flex items-center justify-center rounded-[2rem] bg-muted/30 shadow-md">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10">
              <Layers className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{note.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                in {topicName}
              </p>
            </div>
          </div>

          {note.description && (
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {note.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>
              {chunkCount} chunk{chunkCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <TrackingButton
              entityType="note"
              entityId={note.id}
              topicId={topicId}
              isTracked={isTracked}
            />
            <AddChunkDialog
              noteId={note.id}
              topicId={topicId}
              onSuccess={() => router.refresh()}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-background/60 hover:bg-background rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add chunk
                </Button>
              }
            />
            <EditDialog
              entityType="note"
              currentName={note.name}
              currentDescription={note.description}
              onSave={async (name, desc) => {
                await updateNote(note.id, topicId, name, desc);
                router.refresh();
              }}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-background/60 hover:bg-background rounded-xl"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note &ldquo;{note.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this note and all its chunks,
              recall items, review logs, and generated questions. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deleteNote(note.id, topicId);
                router.push(`/dashboard/materials/${topicId}`);
                router.refresh();
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
