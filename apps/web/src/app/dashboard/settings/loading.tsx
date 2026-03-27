import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 px-8 py-10 max-w-6xl">
      {/* Header */}
      <header>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80 mt-2" />
      </header>

      {/* Two-pane layout */}
      <div className="flex gap-8 h-[calc(100vh-10rem)]">
        {/* Left nav */}
        <div className="w-[200px] shrink-0 flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
          <div className="my-2" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-hidden space-y-8">
          {/* Account section */}
          <div className="rounded-[2rem] bg-muted/40 shadow-md p-8 space-y-6">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>

          {/* Notification section */}
          <div className="rounded-[2rem] bg-muted/40 shadow-md p-8 space-y-6">
            <Skeleton className="h-6 w-44" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Quote section */}
          <div className="rounded-[2rem] bg-muted/40 shadow-md p-10 flex items-center gap-8">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-4 w-28 mt-2" />
            </div>
            <Skeleton className="h-32 w-32 rounded-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
