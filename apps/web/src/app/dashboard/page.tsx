'use client';

import ScheduleCard from '@/components/schedule-card';
import ReviewsTableCard from '@/components/focus-topics-table';
import { HeaderStats } from '@/components/header-stats';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';

export default function Page() {
  const resolveTargetMs = (unix: number) => {
    return unix < 1e12 ? unix * 1000 : unix;
  };

  const [targetMs] = useState(() => resolveTargetMs(1755372460));
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, targetMs - Date.now())
  );

  useEffect(() => {
    setRemaining(Math.max(0, targetMs - Date.now()));
    if (targetMs <= Date.now()) return;
    const interval = setInterval(() => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        clearInterval(interval);
      } else {
        setRemaining(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  const format = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  return (
    <>
      <div className="flex flex-col gap-4 p-6 lg:h-full lg:min-h-[calc(100svh-3rem)]">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl shrink-0">Welcome Back!</h1>
            <span className="text-muted-foreground">
              Let&apos;s work on reviews consistently.
            </span>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex flex-col">
              <span className="tabular-nums text-right text-xl">
                {format(remaining)}
              </span>
              <span className="text-muted-foreground">
                {remaining > 0 ? 'Until next review' : 'Your review is ready'}
              </span>
            </div>
            {remaining === 0 && (
              <Button asChild>
                <Link href="/dashboard/reviews">
                  <span className="relative flex size-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-85"></span>
                    <span className="relative inline-flex size-4 rounded-full bg-primary">
                      <BellRing />
                    </span>
                  </span>
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          <div className="flex flex-col w-full flex-grow gap-4">
            <HeaderStats />
            <div className="bg-accent p-6 rounded-xl flex flex-col gap-4 items-center justify-center">
              <span className="text-3xl text-muted-foreground">
                No renewal suggested for today
              </span>
              <span className="text-muted-foreground text-xs">
                Chunks that require tracking renewal or new tracking will be
                listed here
              </span>
            </div>
            <ReviewsTableCard />
          </div>
          <ScheduleCard />
        </div>
      </div>
      <div className="w-full bg-muted h-10"></div>
    </>
  );
}
