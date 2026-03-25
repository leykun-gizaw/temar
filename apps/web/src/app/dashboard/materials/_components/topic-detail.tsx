'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
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
import AddNoteDialog from '@/components/add-note-dialog';
import { updateTopic } from '@/lib/actions/update';
import { deleteTopic } from '@/lib/actions/delete';

interface TopicDetailProps {
  topic: {
    id: string;
    name: string;
    description: string;
  };
  noteCount: number;
  isTracked: boolean;
}

export default function TopicDetail({
  topic,
  noteCount,
  isTracked,
}: TopicDetailProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex-1 flex items-center justify-center rounded-[2rem] bg-muted/30 shadow-md">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{topic.name}</h2>
            </div>
          </div>

          {topic.description && (
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {topic.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>
              {noteCount} note{noteCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <TrackingButton
              entityType="topic"
              entityId={topic.id}
              isTracked={isTracked}
            />
            <AddNoteDialog
              topicId={topic.id}
              onSuccess={() => router.refresh()}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-background/60 hover:bg-background rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add note
                </Button>
              }
            />
            <EditDialog
              entityType="topic"
              currentName={topic.name}
              currentDescription={topic.description}
              onSave={async (name, desc) => {
                await updateTopic(topic.id, name, desc);
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
            <AlertDialogTitle>Delete topic &ldquo;{topic.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and all its notes, chunks,
              recall items, review logs, and generated questions. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deleteTopic(topic.id);
                router.push('/dashboard/materials');
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
