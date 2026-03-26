'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import {
  useSSE,
  type GenerationStatusEvent,
} from '@/components/providers/sse-provider';
import { getTrackingStatus } from '@/lib/actions/tracking';
import { cn } from '@/lib/utils';
import { notifyPassBalanceChanged } from '@/lib/pass-events';

/**
 * Compact header chip that shows the number of chunks currently
 * pending or generating questions. Visible on every dashboard route
 * so the user knows work is happening in the background.
 *
 * Clicking navigates to the dashboard where the full
 * GenerationQueueCard shows details.
 */
export function GenerationStatusChip() {
  const { subscribe } = useSSE();
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  // Seed from server on mount
  const refresh = useCallback(() => {
    getTrackingStatus().then((items) => {
      setActiveIds(
        new Set(
          items
            .filter((i) => i.status === 'pending' || i.status === 'generating')
            .map((i) => i.chunkId)
        )
      );
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep it up to date via SSE
  useEffect(() => {
    return subscribe('generation:status', (event) => {
      const e = event as GenerationStatusEvent;

      setActiveIds((prev) => {
        const next = new Set(prev);
        if (e.status === 'pending' || e.status === 'generating') {
          next.add(e.chunkId);
        } else {
          // ready or failed — no longer active
          next.delete(e.chunkId);
        }
        return next;
      });

      // Trigger a server-side balance refresh (don't use e.newBalance
      // directly — it's raw USD from recordUsage, not a pass count)
      if (e.status === 'ready') {
        notifyPassBalanceChanged();
      }
    });
  }, [subscribe]);

  if (activeIds.size === 0) return null;

  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex items-center gap-1.5 h-fit p-2 rounded-xl text-xs font-semibold transition-colors',
        'bg-blue-500/90 text-white hover:bg-blue-500'
      )}
      title="Questions are being generated — click for details"
    >
      <Zap className="h-3.5 w-3.5 animate-pulse" />
      <span>
        {activeIds.size} generating
      </span>
    </Link>
  );
}
