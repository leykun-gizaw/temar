import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-full space-y-6">
      <div className="flex flex-col h-full">
        {/* Header bar skeleton */}
        <div className="flex items-end justify-between px-6 py-2 border-b shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-12 w-12 rounded" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Two-column main area skeleton */}
        <div className="flex flex-1 min-h-0 divide-x">
          {/* Left column */}
          <div className="w-1/2 flex flex-col p-6 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Right column */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex-1 p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>

        {/* Bottom bar skeleton */}
        <div className="flex items-center justify-between px-6 py-3 border-t shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-14" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-[80px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
