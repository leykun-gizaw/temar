'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SSEEventType =
  | 'generation:status'
  | 'analysis:complete';

export interface GenerationStatusEvent {
  type: 'generation:status';
  chunkId: string;
  chunkName: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  errorMessage?: string | null;
  retryCount?: number;
}

export interface AnalysisCompleteEvent {
  type: 'analysis:complete';
  requestId: string;
  status: 'success' | 'error';
  data?: {
    scorePercent: number;
    strengths: string[];
    weaknesses: string[];
    reasoning: string;
    suggestedRating: number;
    suggestedLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
  };
  passDeducted?: number;
  message?: string;
}

export type SSEEventPayload = GenerationStatusEvent | AnalysisCompleteEvent;

type SSECallback = (data: SSEEventPayload) => void;

interface SSEContextValue {
  /** Subscribe to a named event type. Returns an unsubscribe function. */
  subscribe: (eventType: SSEEventType, callback: SSECallback) => () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SSEContext = createContext<SSEContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SSEProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Map<string, Set<SSECallback>>());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as SSEEventPayload;
        const subs = listenersRef.current.get(data.type);
        if (subs) {
          subs.forEach((cb) => cb(data));
        }
      } catch {
        // Ignore malformed payloads
      }
    };

    // Register listeners for each named SSE event type
    const eventTypes: SSEEventType[] = [
      'generation:status',
      'analysis:complete',
    ];

    for (const t of eventTypes) {
      es.addEventListener(t, handleEvent);
    }

    return () => {
      for (const t of eventTypes) {
        es.removeEventListener(t, handleEvent);
      }
      es.close();
      esRef.current = null;
    };
  }, []);

  const subscribe = useCallback(
    (eventType: SSEEventType, callback: SSECallback): (() => void) => {
      if (!listenersRef.current.has(eventType)) {
        listenersRef.current.set(eventType, new Set());
      }
      listenersRef.current.get(eventType)!.add(callback);

      return () => {
        listenersRef.current.get(eventType)?.delete(callback);
      };
    },
    []
  );

  return (
    <SSEContext.Provider value={{ subscribe }}>{children}</SSEContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to server-sent events.
 *
 * ```tsx
 * const { subscribe } = useSSE();
 * useEffect(() => subscribe('generation:status', (e) => { ... }), []);
 * ```
 */
export function useSSE(): SSEContextValue {
  const ctx = useContext(SSEContext);
  if (!ctx) {
    throw new Error('useSSE must be used within an <SSEProvider>');
  }
  return ctx;
}
