'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { renderMermaid } from '../nodes/MermaidNode';

interface InsertMermaidDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

const DEFAULT_MERMAID = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

export default function InsertMermaidDialog({
  open,
  onClose,
  onInsert,
}: InsertMermaidDialogProps) {
  const [code, setCode] = useState(DEFAULT_MERMAID);
  const [previewSvg, setPreviewSvg] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code.trim()) {
      setPreviewSvg('');
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      renderMermaid(code).then((result) => {
        if (cancelled) return;
        if (result.error !== null) {
          setPreviewError(result.error);
          setPreviewSvg('');
        } else {
          setPreviewSvg(result.svg ?? '');
          setPreviewError(null);
        }
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  const handleInsert = () => {
    if (!code.trim()) return;
    onInsert(code.trim());
    setCode(DEFAULT_MERMAID);
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setCode(DEFAULT_MERMAID);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Mermaid Diagram</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mermaid-code">Diagram Code</Label>
            <textarea
              id="mermaid-code"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preview</Label>
            <div className="border rounded-md p-3 bg-muted/30 min-h-[100px] overflow-x-auto">
              {previewError && (
                <p className="text-sm text-red-500">{previewError}</p>
              )}
              {previewSvg && (
                <div
                  ref={previewRef}
                  className="flex justify-center [&_svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              )}
              {!previewSvg && !previewError && code.trim() && (
                <p className="text-sm text-muted-foreground text-center">
                  Rendering...
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsert} disabled={!code.trim()}>
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
