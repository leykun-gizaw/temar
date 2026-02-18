'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Loader2 } from 'lucide-react';
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
}

export default function TrackingButton({
  entityType,
  entityId,
  topicId,
  noteId,
  isTracked: initialTracked,
}: TrackingButtonProps) {
  const [tracked, setTracked] = useState(initialTracked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (tracked) {
          if (entityType === 'topic') {
            await untrackTopic(entityId);
          } else if (entityType === 'note') {
            await untrackNote(entityId, topicId ?? '');
          } else {
            await untrackChunk(entityId, noteId ?? '', topicId ?? '');
          }
          setTracked(false);
        } else {
          if (entityType === 'topic') {
            await trackTopic(entityId);
          } else if (entityType === 'note') {
            await trackNote(entityId, topicId ?? '');
          } else {
            await trackChunk(entityId, noteId ?? '', topicId ?? '');
          }
          setTracked(true);
        }
      } catch (err) {
        console.error('Tracking toggle failed:', err);
      }
    });
  };

  return (
    <Button
      size="sm"
      variant={tracked ? 'default' : 'outline'}
      onClick={handleToggle}
      disabled={isPending}
      title={tracked ? `Untrack ${entityType}` : `Track ${entityType} for recall`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Target className="h-4 w-4" />
      )}
      <span className="ml-1.5">
        {tracked ? 'Tracking' : 'Track'}
      </span>
    </Button>
  );
}
