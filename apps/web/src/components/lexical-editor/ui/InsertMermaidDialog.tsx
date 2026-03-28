'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  Label,
  Button,
} from '@temar/ui';
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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <span className="absolute left-1/2 top-0" />
      </PopoverAnchor>
      <PopoverContent
        className="w-[520px]"
        side="bottom"
        align="center"
        sideOffset={12}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">Mermaid Diagram</p>

          <div className="space-y-1.5">
            <Label htmlFor="mermaid-code" className="text-xs font-medium">
              Diagram Code
            </Label>
            <textarea
              id="mermaid-code"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px] resize-y"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Preview</Label>
            <div className="border rounded-xl p-3 bg-muted/30 min-h-[120px] max-h-[300px] overflow-auto">
              {previewError && (
                <p className="text-xs text-red-500">{previewError}</p>
              )}
              {previewSvg && (
                <div
                  ref={previewRef}
                  className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              )}
              {!previewSvg && !previewError && code.trim() && (
                <p className="text-xs text-muted-foreground text-center">
                  Rendering...
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1 h-7 rounded-xl text-xs"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 rounded-xl text-xs"
              onClick={handleInsert}
              disabled={!code.trim()}
            >
              Insert
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
