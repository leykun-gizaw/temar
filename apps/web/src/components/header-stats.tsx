'use client';

import { Grid2X2, LibraryBigIcon, Notebook } from 'lucide-react';

export function HeaderStats() {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <LibraryBigIcon />
            <h1>Topics</h1>
          </div>
          <h1 className="text-4xl">4</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          3 in use today
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <Notebook />
            <h1>Notes</h1>
          </div>
          <h1 className="text-4xl">13</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          7 in use today
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 h-fit items-center justify-between w-full rounded-xl border">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2 items-center pr-2 h-full border-r">
            <Grid2X2 />
            <h1>Chunks</h1>
          </div>
          <h1 className="text-4xl">32</h1>
        </div>
        <span className="text-xs text-muted-foreground w-full">
          13 in use today
        </span>
      </div>
    </div>
  );
}

export default HeaderStats;
