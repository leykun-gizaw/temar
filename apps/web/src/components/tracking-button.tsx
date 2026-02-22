'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, X, ArrowBigDownDashIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  trackTopic,
  trackNote,
  trackChunk,
  untrackTopic,
  untrackNote,
  untrackChunk,
} from '@/lib/actions/tracking';

interface TrackingButtonProps {
  entityType: 'topic' | 'note' | 'chunk';
  entityId: string;
  topicId?: string;
  noteId?: string;
  isTracked: boolean;
  /** Compact mode for card action rows (icon only, no label) */
  compact?: boolean;
}

export default function TrackingButton({
  entityType,
  entityId,
  topicId,
  noteId,
  isTracked: initialTracked,
  compact = false,
}: TrackingButtonProps) {
  const [tracked, setTracked] = useState(initialTracked);
  const [isPending, startTransition] = useTransition();

  const handleTrack = () => {
    startTransition(async () => {
      try {
        if (entityType === 'topic') {
          await trackTopic(entityId);
        } else if (entityType === 'note') {
          await trackNote(entityId, topicId ?? '');
        } else {
          await trackChunk(entityId, noteId ?? '', topicId ?? '');
        }
        setTracked(true);
      } catch (err) {
        console.error('Track failed:', err);
      }
    });
  };

  const handleUntrack = () => {
    startTransition(async () => {
      try {
        if (entityType === 'topic') {
          await untrackTopic(entityId);
        } else if (entityType === 'note') {
          await untrackNote(entityId, topicId ?? '');
        } else {
          await untrackChunk(entityId, noteId ?? '', topicId ?? '');
        }
        setTracked(false);
      } catch (err) {
        console.error('Untrack failed:', err);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className={`transition-colors cursor-pointer ${
            tracked
              ? 'text-primary hover:text-primary/70'
              : 'text-muted-foreground hover:text-primary'
          }`}
          title={tracked ? `Tracking ${entityType}` : `Track ${entityType}`}
        >
          {isPending ? (
            <Loader2 size={compact ? 14 : 16} className="animate-spin" />
          ) : (
            <ArrowBigDownDashIcon size={compact ? 16 : 18} />
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {!tracked && (
          <DropdownMenuItem onClick={handleTrack} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Track for recall
          </DropdownMenuItem>
        )}
        {tracked && (
          <DropdownMenuItem
            onClick={handleUntrack}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Untrack
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
