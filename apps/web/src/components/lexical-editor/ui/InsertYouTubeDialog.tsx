'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface InsertYouTubeDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (videoID: string) => void;
}

function extractVideoID(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export default function InsertYouTubeDialog({
  open,
  onClose,
  onInsert,
}: InsertYouTubeDialogProps) {
  const [url, setUrl] = useState('');

  const videoID = useMemo(() => extractVideoID(url), [url]);

  const handleInsert = () => {
    if (!videoID) return;
    onInsert(videoID);
    setUrl('');
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setUrl('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Insert YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="youtube-url">YouTube URL or Video ID</Label>
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
          {videoID && (
            <div className="border rounded-md overflow-hidden bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoID}/hqdefault.jpg`}
                alt="Video thumbnail"
                className="w-full max-h-48 object-cover"
              />
              <p className="text-xs text-muted-foreground px-2 py-1">
                Video ID: {videoID}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsert} disabled={!videoID}>
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
