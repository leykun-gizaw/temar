'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '@/components/mermaid-diagram';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteChunk } from '@/lib/actions/delete';
import { updateChunk } from '@/lib/actions/update';
import EditDialog from '@/components/edit-dialog';
import TrackingButton from '@/components/tracking-button';
import Blinker from '@/components/blinker';

interface ChunkCardProps {
  id: string;
  name: string;
  description: string;
  contentMd: string | null;
  contentJson: unknown;
  topicId: string;
  noteId: string;
  isTracked: boolean;
}

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default function ChunkCard({
  id,
  name,
  description,
  contentMd,
  contentJson,
  topicId,
  noteId,
  isTracked,
}: ChunkCardProps) {
  const [open, setOpen] = useState(false);

  const preview = contentMd || description;

  return (
    <div className="relative flex flex-col h-[180px] justify-between">
      {isTracked && (
        <div className="absolute top-2 right-2 z-10">
          <Blinker />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer flex-1 h-full border bg-muted/50 rounded-t-xl border-b-0 hover:bg-muted"
      >
        <div className="text-xs flex h-full text-left text-muted-foreground whitespace-pre-wrap p-4 overflow-hidden">
          <span>{excerpt(preview)}</span>
        </div>
      </button>
      <div className="flex items-end justify-between p-2 border rounded-b-xl">
        <span className="text-sm font-semibold">📄 {name}</span>
        <div className="flex items-center gap-1">
          <EditDialog
            entityType="chunk"
            currentName={name}
            currentDescription={description}
            onSave={async (newName, newDesc) => {
              await updateChunk(id, noteId, topicId, newName, newDesc);
            }}
            trigger={
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1"
                title="Edit chunk"
              >
                <Pencil size={14} />
              </span>
            }
          />
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this chunk?')) {
                deleteChunk(id, noteId, topicId);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                if (confirm('Delete this chunk?')) {
                  deleteChunk(id, noteId, topicId);
                }
              }
            }}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
            title="Delete chunk"
          >
            <Trash2 size={14} />
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <TrackingButton
              entityType="chunk"
              entityId={id}
              topicId={topicId}
              noteId={noteId}
              isTracked={isTracked}
              compact
            />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-8xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>📄 {name}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto max-h-[95vh]">
            {contentMd ? (
              <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang = match?.[1];
                      const code = String(children).replace(/\n$/, '');

                      if (lang === 'mermaid') {
                        return <MermaidDiagram chart={code} />;
                      }

                      return lang ? (
                        <pre className="bg-muted/50 rounded-md p-3 overflow-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {contentMd}
                </Markdown>
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-words p-4 bg-muted/30 rounded-md">
                {contentJson
                  ? JSON.stringify(contentJson, null, 2)
                  : description}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
