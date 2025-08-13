'use client';

import { ScheduleCard } from '@/components/schedule-card';
import { FocusTopicsTable } from '@/components/focus-topics-table';
import { HeaderStats } from '@/components/header-stats';

export default function Page() {
  return (
    <div className="flex flex-col gap-6 py-6 px-12 lg:h-full lg:min-h-[calc(100svh-3rem)]">
      <div>
        <h1 className="text-2xl shrink-0">Welcome Back!</h1>
        <span className="text-muted-foreground">
          Let&apos;s work on reviews consistently.
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-10 h-full min-h-0">
        <div className="flex flex-col w-full flex-grow gap-8">
          <HeaderStats />
          <FocusTopicsTable />
        </div>
        <ScheduleCard />
      </div>
    </div>
  );
}
