import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <span className="text-6xl">📗</span>
        <div className="mb-4">
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="flex items-center gap-12">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-24" />
          </span>
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      <div className="w-full bg-border h-px" />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <div className="text-lg font-bold bg-primary/10 p-2">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2 bg-muted py-2 px-3 rounded-full">
            <Skeleton className="h-4 w-24" />
          </span>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border rounded-xl flex flex-col h-[180px]">
            <div className="flex-1 border-b p-4 bg-muted/50">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="h-1/4 flex items-center pl-4">
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}

        <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
          <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
