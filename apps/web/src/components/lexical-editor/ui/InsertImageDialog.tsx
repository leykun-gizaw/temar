'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Button,
} from '@temar/ui';

interface InsertImageDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string, altText: string) => void;
}

export default function InsertImageDialog({
  open,
  onClose,
  onInsert,
}: InsertImageDialogProps) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const handleInsert = () => {
    if (!src.trim()) return;
    onInsert(src.trim(), altText.trim());
    setSrc('');
    setAltText('');
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSrc('');
      setAltText('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.png"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-alt">Alt text (optional)</Label>
            <Input
              id="image-alt"
              placeholder="Describe the image"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
          {src.trim() && (
            <div className="border rounded-md p-2 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={altText || 'Preview'}
                className="max-h-40 mx-auto rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsert} disabled={!src.trim()}>
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
