import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-5 h-[calc(100svh-var(--header-height))] overflow-hidden">
      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Welcome + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {/* Stat Cards Row (5 cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2rem] bg-muted/40 shadow-md p-5 flex flex-col gap-2"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Growth Overview */}
        <div className="rounded-[2rem] bg-muted/40 shadow-md p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>

        {/* Reviews Table */}
        <div className="rounded-[2rem] bg-muted/40 shadow-md p-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-full mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5">
        {/* Consistency Card */}
        <div className="rounded-[2rem] bg-muted/40 shadow-md p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Upcoming Sessions */}
        <div className="rounded-[2rem] bg-muted/40 shadow-md p-6 flex-1">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Queue */}
        <div className="rounded-[2rem] bg-muted/40 shadow-md p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
