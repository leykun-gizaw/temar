import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-[calc(100vh-var(--header-height))] flex flex-col gap-0">
      {/* Tab bar */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1 w-fit shadow-sm">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      {/* Review session content */}
      <div className="flex-1 min-h-0 grid grid-rows-[auto_1fr]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Prev/Next pill */}
            <div className="flex items-center gap-0.5 bg-muted/60 rounded-full p-0.5">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-8 mx-1" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            {/* Breadcrumb */}
            <Skeleton className="h-3 w-48" />
            {/* State badge */}
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-[140px] rounded-full" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-full">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        </div>

        {/* Main: two-panel layout */}
        <div className="p-4 min-h-0 flex-1 flex gap-3">
          {/* Left panel: Question card */}
          <div className="w-[45%] h-full p-1">
            <div className="h-full rounded-2xl bg-card shadow-md overflow-hidden p-8 lg:p-10 space-y-8">
              {/* Due Today badge */}
              <Skeleton className="h-6 w-24 rounded-full" />

              {/* Question title */}
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-3/4" />
              </div>

              {/* Question text */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </div>

              {/* Rubric section */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 p-5 rounded-xl space-y-2">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-6 w-10" />
                </div>
                <div className="bg-muted/40 p-5 rounded-xl space-y-2">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="bg-muted/40 p-5 rounded-xl col-span-2 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Editor + Bottom bar */}
          <div className="w-[55%] h-full flex flex-col gap-2 p-1">
            {/* Editor card (takes all available space) */}
            <div className="flex-1 min-h-0 rounded-2xl bg-card shadow-md overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-2.5 shrink-0 bg-muted/20">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex-1 p-5 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="shrink-0 rounded-2xl bg-card shadow-md px-4 py-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-24 rounded-full" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
