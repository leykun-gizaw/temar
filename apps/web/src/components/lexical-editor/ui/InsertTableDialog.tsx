'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InsertTableDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (rows: number, columns: number) => void;
}

const MAX_GRID = 10;

export default function InsertTableDialog({
  open,
  onClose,
  onInsert,
}: InsertTableDialogProps) {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  const handleSelect = useCallback(
    (row: number, col: number) => {
      onInsert(row + 1, col + 1);
      onClose();
    },
    [onInsert, onClose]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {hoverRow > 0 || hoverCol > 0
              ? `${hoverRow + 1} × ${hoverCol + 1}`
              : 'Hover to select size'}
          </p>
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${MAX_GRID}, 1fr)`,
            }}
          >
            {Array.from({ length: MAX_GRID * MAX_GRID }).map((_, idx) => {
              const r = Math.floor(idx / MAX_GRID);
              const c = idx % MAX_GRID;
              const active = r <= hoverRow && c <= hoverCol;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`w-5 h-5 border rounded-[2px] transition-colors ${
                    active
                      ? 'bg-primary border-primary'
                      : 'bg-muted/50 border-border hover:border-primary/50'
                  }`}
                  onMouseEnter={() => {
                    setHoverRow(r);
                    setHoverCol(c);
                  }}
                  onClick={() => handleSelect(r, c)}
                />
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
