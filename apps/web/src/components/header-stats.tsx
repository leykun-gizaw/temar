'use client';

import {
  Grid2X2,
  LibraryBigIcon,
  Notebook,
  Target,
  TestTubeDiagonal,
} from 'lucide-react';

export function HeaderStats({
  topicsCount,
  notesCount,
  chunksCount,
  trackedCount = 0,
  dueCount = 0,
}: {
  topicsCount: number | string;
  notesCount: number | string;
  chunksCount: number | string;
  trackedCount?: number;
  dueCount?: number;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <LibraryBigIcon />
            <h1>Topics</h1>
          </div>
          <h1 className="text-4xl">{topicsCount}</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full flex items-center gap-1">
          <Target className="h-3 w-3" />
          {trackedCount} chunk{trackedCount !== 1 ? 's' : ''} tracked
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <Notebook />
            <h1>Notes</h1>
          </div>
          <h1 className="text-4xl">{notesCount}</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          {notesCount} total
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <Grid2X2 />
            <h1>Chunks</h1>
          </div>
          <h1 className="text-4xl">{chunksCount}</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          {dueCount} due for review
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <TestTubeDiagonal />
            <h1>Reviews</h1>
          </div>
          <h1 className="text-4xl">{chunksCount}</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          {dueCount} due for review
        </span>
      </div>
    </div>
  );
}

export default HeaderStats;
