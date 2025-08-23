'use client';

import { CalendarEvent } from '@/lib/calendar-types';
import DashboardCountdown from '@/components/dashboard-countdown';
import { Button } from './ui/button';
import Link from 'next/link';
import { BellRing } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = { events: CalendarEvent[] };

function pickCurrentAndNext(events: CalendarEvent[], now: number) {
  let current: CalendarEvent | null = null;
  let next: CalendarEvent | null = null;
  for (const ev of events) {
    const start = new Date(ev.start).getTime();
    const end = new Date(ev.end).getTime();
    if (start <= now && end >= now) {
      if (!current || start > new Date(current.start).getTime()) current = ev;
    } else if (start > now) {
      if (!next || start < new Date(next.start).getTime()) next = ev;
    }
  }
  return { currentEvent: current, closestEvent: next };
}

export function EventsSummary({ events }: Props) {
  const [now, setNow] = useState(() => Date.now());

  const { currentEvent, closestEvent, boundaryTime } = useMemo(() => {
    const { currentEvent, closestEvent } = pickCurrentAndNext(events, now);
    let boundaryTime: number | null = null;
    if (currentEvent) {
      boundaryTime = new Date(currentEvent.end).getTime();
    } else if (closestEvent) {
      boundaryTime = new Date(closestEvent.start).getTime();
    }
    return { currentEvent, closestEvent, boundaryTime };
  }, [events, now]);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    if (boundaryTime && boundaryTime > now) {
      const delay = Math.min(boundaryTime - now + 5, 2_147_483_647); // clamp
      id = setTimeout(() => setNow(Date.now()), delay);
    } else {
      // Fallback tick every 60s if no boundary (keeps day rollover accurate)
      id = setTimeout(() => setNow(Date.now()), 60_000);
    }
    return () => clearTimeout(id);
  }, [boundaryTime, now, events]);

  return (
    <div className="border p-4 rounded-xl flex gap-4 items-center justify-between flex-wrap">
      <div className="flex flex-col h-full justify-between">
        <span className="text-xl">Now</span>
        <span className="text-muted-foreground text-sm">
          {currentEvent ? (
            <Button>
              <Link
                className="flex gap-2 items-center"
                href="/dashboard/reviews"
              >
                <span className="relative flex size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-85" />
                  <span className="relative inline-flex size-4 rounded-full bg-primary">
                    <BellRing />
                  </span>
                </span>
                <span>{currentEvent.title}</span>
              </Link>
            </Button>
          ) : (
            'No current events'
          )}
        </span>
      </div>
      <div className="flex flex-col items-end h-full">
        <span className="text-xl">Next</span>
        <span className="text-sm text-muted-foreground">
          {closestEvent ? (
            <div className="flex flex-col text-muted-foreground text-sm items-end">
              <span>{closestEvent.title}</span>
              <span className="tabular-nums">
                Starts in <DashboardCountdown target={closestEvent.start} />
              </span>
            </div>
          ) : (
            'No upcoming events'
          )}
        </span>
      </div>
    </div>
  );
}
