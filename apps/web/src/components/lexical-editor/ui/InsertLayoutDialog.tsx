'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from '@temar/ui';

interface InsertLayoutDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (templateColumns: string, columnCount: number) => void;
}

const LAYOUT_OPTIONS = [
  { label: '2 Columns (Equal)', template: '1fr 1fr', count: 2 },
  { label: '3 Columns (Equal)', template: '1fr 1fr 1fr', count: 3 },
  { label: '2 Columns (Wide Left)', template: '2fr 1fr', count: 2 },
  { label: '2 Columns (Wide Right)', template: '1fr 2fr', count: 2 },
];

export default function InsertLayoutDialog({
  open,
  onClose,
  onInsert,
}: InsertLayoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Insert Column Layout</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.template}
              type="button"
              className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 transition-colors text-left cursor-pointer"
              onClick={() => {
                onInsert(opt.template, opt.count);
                onClose();
              }}
            >
              <div
                className="flex gap-1 w-16 shrink-0"
                style={{
                  display: 'grid',
                  gridTemplateColumns: opt.template,
                  gap: '3px',
                }}
              >
                {Array.from({ length: opt.count }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-sm bg-muted border border-border"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
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
