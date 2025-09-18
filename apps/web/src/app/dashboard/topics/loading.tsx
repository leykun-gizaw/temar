export default function LoadingTopics() {
  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
        <div className="h-7 w-40 rounded-md bg-muted animate-pulse mt-2" />
        <div className="h-4 w-60 rounded-md bg-muted animate-pulse" />
      </div>
      <hr />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
        <div className="flex items-center justify-between w-full">
          <div className="h-8 w-36 rounded-full bg-muted animate-pulse" />
          <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl flex flex-col h-[180px] overflow-hidden"
          >
            <div className="flex-1 border-b bg-muted/50">
              <div className="h-full w-full animate-pulse" />
            </div>
            <div className="h-1/4 flex items-center pl-4">
              <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        ))}
        <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
          <div className="flex-1 flex items-center justify-center">
            <div className="h-5 w-28 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
