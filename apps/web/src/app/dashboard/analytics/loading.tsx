import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-5 h-[calc(100svh-var(--header-height))] overflow-hidden">
      <div className="flex flex-col gap-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Tab bar skeleton */}
        <Skeleton className="h-9 w-[500px] rounded-full" />

        {/* KPI cards row */}
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

        {/* Hero chart skeleton */}
        <Skeleton className="h-[350px] w-full rounded-[2.5rem]" />

        {/* Two smaller charts side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-[2.5rem]" />
          <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
