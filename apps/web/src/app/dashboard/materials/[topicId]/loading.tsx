import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center rounded-[2rem] bg-muted/30 shadow-md">
      <div className="flex flex-col items-center gap-5 max-w-md w-full p-10">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}
