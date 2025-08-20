'use client';

import { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { BookPlusIcon } from 'lucide-react';

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  notes: Array<{ id: string; title: string; content: string }>;
}

export interface AddTopicDialogProps {
  onAdd: (topic: Topic) => void;
  trigger?: React.ReactNode;
  defaultColor?: string;
}

export function AddTopicDialog({
  onAdd,
  trigger,
  defaultColor = '#4A90E2',
}: AddTopicDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState(defaultColor);

  const slug = useMemo(
    () =>
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'),
    [title]
  );

  const reset = () => {
    setTitle('');
    setDescription('');
    setTagsInput('');
    setColor(defaultColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title: title.trim(),
      slug,
      description: description.trim(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      notes: [],
    };
    onAdd(newTopic);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button">
            <BookPlusIcon /> Add Topic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <form className="flex flex-col h-full" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
            <DialogDescription>
              Create a new topic to track progress & notes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-1 overflow-auto space-y-4 mt-2">
            <div className="space-y-2 ">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced Graph Theory"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the topic..."
                rows={4}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="algorithms, data structures"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 p-1"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={!title.trim()}>
                Save
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddTopicDialog;
