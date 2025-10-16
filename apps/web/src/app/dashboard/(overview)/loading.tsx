import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <div className="flex flex-col gap-4 p-6 lg:h-full lg:min-h-[calc(100svh-3rem)]">
        {/* Top header */}
        <div className="flex justify-between">
          <Skeleton className="h-7 w-40" />
        </div>

        {/* Main content row */}
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          {/* Left column */}
          <div className="flex flex-col w-full flex-grow gap-4">
            {/* EventsSummary skeleton */}
            <div className="border p-4 rounded-xl flex gap-4 items-center justify-between flex-wrap">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-9 w-56" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>

            {/* HeaderStats skeleton (3 stat cards) */}
            <div className="flex flex-col md:flex-row gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border"
                >
                  <div className="flex justify-between w-full items-center">
                    <div className="flex gap-2 items-center pr-2 h-full border-r">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-10 w-12" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>

            {/* ReviewsTableCard skeleton */}
            <div className="rounded-xl border shadow-none h-full">
              <div className="border-b p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-9 w-9" />
                </div>
                <Skeleton className="h-4 w-56" />
                <div className="mt-2">
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <div className="p-4">
                {/* table header */}
                <div className="grid grid-cols-5 gap-4 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4" />
                  ))}
                </div>
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 py-4">
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <div className="flex justify-end">
                        <Skeleton className="h-9 w-10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - ScheduleCard skeleton */}
          <div className="flex flex-col h-full min-h-0 w-full lg:w-2xl md:w-full rounded-xl border">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            <div className="h-30 border-b p-4">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="p-0 flex-1 h-full min-h-0">
              <div className="p-4 h-full min-h-0">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-muted h-10" />
    </>
  );
}
