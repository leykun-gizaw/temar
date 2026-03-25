import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 p-1">
      {/* Top info card */}
      <div className="shrink-0 rounded-[2rem] bg-muted/40 shadow-md p-6 space-y-4">
        {/* Breadcrumb row + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-3" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Title + meta */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Recall stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-background/60 p-3 space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Editor toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-2">
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Editor area */}
      <div className="flex-1 rounded-[2rem] bg-muted/30 shadow-md p-6 min-h-0">
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
