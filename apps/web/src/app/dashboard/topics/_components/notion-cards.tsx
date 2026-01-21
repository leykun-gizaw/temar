'use client';

export default function NotionCard({ item }: { item: any }) {
  return (
    <div
      className="flex flex-col justify-between h-full"
      onMouseEnter={() => console.log('Mouse inside')}
    >
      <div className="border-b flex-1 text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
        {item.description}
      </div>
      <div className="h-fit flex items-center p-3">
        <span className="text-sm font-semibold">
          📚
          {item.name}
        </span>
      </div>
    </div>
  );
}
