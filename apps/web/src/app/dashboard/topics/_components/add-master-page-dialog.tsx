/**
 * TODO: Add a dialog to add a Notion Master Page ID
 */

'use client';

import { useState, useRef, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

import { createMasterPage } from '@/lib/actions/master-pages';
import { MasterPageErrorState } from '@/lib/definitions';

interface AddMasterPageDialogProps {
  trigger?: React.ReactNode;
}

export default function AddMasterPageDialog({
  trigger,
}: AddMasterPageDialogProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const initialErrorState: MasterPageErrorState = { errors: {}, message: null };
  const [errorState, formAction, isPending] = useActionState(
    createMasterPage,
    initialErrorState
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            ref={triggerRef}
            type="button"
            size={'sm'}
            variant={'outline'}
          >
            <BookOpen /> New Master Page
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <form className="flex flex-col h-full" action={formAction}>
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-2">
              <span className="text-5xl">📄</span>
              Add Master Page
            </DialogTitle>
            <DialogDescription className="text-center">
              Add a Notion Master Page ID to sync your topics and notes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="notionMasterPageId"
                name="notionMasterPageId"
                placeholder="Enter Notion Master Page ID"
              />
              {errorState.errors?.notionMasterPageId && (
                <p className="text-sm text-red-600">
                  {errorState.errors.notionMasterPageId[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Spinner className="size4" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Add Master Page
            </Button>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
