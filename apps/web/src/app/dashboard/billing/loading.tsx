import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-full p-8">
      {/* Header */}
      <header className="mb-12">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-5 w-72 mt-2" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 items-start">
        {/* Left column */}
        <div className="space-y-8">
          {/* Plan + Balance grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Plan Card */}
            <div className="rounded-[2rem] bg-muted/50 p-9 shadow-md space-y-5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-full" />
            </div>

            {/* Pass Balance Card */}
            <div className="rounded-[2rem] bg-muted/40 p-9 shadow-md flex flex-col items-center">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-16 w-24 mb-1" />
              <Skeleton className="h-4 w-28 mb-6" />
              <Skeleton className="h-3 w-full rounded-full mb-3" />
              <Skeleton className="h-4 w-48 mt-3" />
            </div>
          </div>

          {/* Top-up Packs */}
          <div>
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[2rem] bg-muted/40 p-6 shadow-md flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-9 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Transaction History */}
        <div>
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="rounded-[2rem] bg-muted/40 shadow-md overflow-hidden">
            {/* Table header */}
            <div className="flex justify-between px-5 py-4 border-b border-border/40">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-5 py-4 border-b border-border/20 last:border-0"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
