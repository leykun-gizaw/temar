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

interface InsertEquationDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (equation: string, inline: boolean) => void;
  initialInline?: boolean;
}

export default function InsertEquationDialog({
  open,
  onClose,
  onInsert,
  initialInline = false,
}: InsertEquationDialogProps) {
  const [equation, setEquation] = useState('');
  const [inline, setInline] = useState(initialInline);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInline(initialInline);
  }, [initialInline]);

  useEffect(() => {
    if (!previewRef.current || !equation.trim()) {
      if (previewRef.current) previewRef.current.innerHTML = '';
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import('katex')).default;
        if (cancelled || !previewRef.current) return;
        katex.render(equation, previewRef.current, {
          displayMode: !inline,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      } catch {
        if (!cancelled && previewRef.current) {
          previewRef.current.textContent = 'Invalid LaTeX';
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [equation, inline]);

  const handleInsert = () => {
    if (!equation.trim()) return;
    onInsert(equation.trim(), inline);
    setEquation('');
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setEquation('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Insert Equation</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInline(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !inline
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => setInline(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                inline
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Inline
            </button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equation-input">LaTeX</Label>
            <textarea
              id="equation-input"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
              placeholder={inline ? 'x^2 + y^2 = r^2' : 'E = mc^2'}
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
            />
          </div>
          {equation.trim() && (
            <div className="border rounded-md p-3 bg-muted/30 min-h-[40px]">
              <div
                ref={previewRef}
                className={inline ? 'inline' : 'text-center'}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInsert}
              disabled={!equation.trim()}
            >
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
