'use client';

import {
  Calendar,
  CalendarCurrentDate,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
} from '@/components/full-calendar';
import {
  ChevronLeft,
  ChevronRight,
  LibraryBigIcon,
  NotebookIcon,
  PlaneTakeoffIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { topics_data } from '@/app/dashboard/dummy-topics-data';
import { ChartPieLegend } from '@/components/review-summery-chart';
import { Card } from '@/components/ui/card';
import { calendar_events } from '@/app/dashboard/dummy-calendar-events-data';

export default function Page() {
  return (
    <div className="flex flex-col p-6 gap-6">
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <PlaneTakeoffIcon size={32} />
          <h1 className="text-3xl font-bold">Overview</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Create</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => console.log('Create new note')}>
              <NotebookIcon />
              Note
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.log('Create new topic')}>
              <LibraryBigIcon />
              Topic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: stacked sections */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="p-4 bg-card rounded-xl border border-border space-y-4 max-h-80">
            <h3 className="font-semibold mb-3">Focus Topics This Week</h3>
            <div className="space-y-3 overflow-auto max-h-64">
              {topics_data.map((topic) => (
                <div key={topic.title} className="bg-muted p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <LibraryBigIcon size={16} />
                    <span className="">{topic.title}</span>
                  </div>
                  <Progress
                    value={topic.progress}
                    className="h-2 w-full rounded-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    Retention
                    <span className="font-semibold">{topic.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ChartPieLegend />
          {/* Additional section placeholder */}
          <div className="p-4 bg-card rounded-xl border border-border">
            Additional Section
          </div>
        </div>
        {/* Column 2: two stacked rows */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="p-4 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-3">Recently Added Topics</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics_data.slice(0, 4).map((topic) => (
                  <div key={topic.title} className="bg-muted p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <LibraryBigIcon size={16} />
                      <span>{topic.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added on{' '}
                      {topic.createdAt
                        ? new Date(topic.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-3">Recently Added Notes</h3>
            <div className="space-y-3">
              {(topics_data[0].notes || []).slice(0, 5).map((note) => (
                <div key={note.title} className="bg-muted p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <NotebookIcon size={16} />
                    <span>{note.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Added on{' '}
                    {note.createdAt
                      ? new Date(note.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Column 3: calendar */}
        <Card className="p-4 flex lg:col-span-1">
          <h1 className="font-semibold">This week at a glance</h1>
          <Calendar view="week" events={calendar_events}>
            <div className="py-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <CalendarViewTrigger
                  view="week"
                  className="aria-[current=true]:bg-accent"
                >
                  Week
                </CalendarViewTrigger>

                <span className="flex-1" />

                <CalendarCurrentDate />

                <CalendarPrevTrigger>
                  <ChevronLeft size={20} />
                  <span className="sr-only">Previous</span>
                </CalendarPrevTrigger>

                <CalendarTodayTrigger>Today</CalendarTodayTrigger>

                <CalendarNextTrigger>
                  <ChevronRight size={20} />
                  <span className="sr-only">Next</span>
                </CalendarNextTrigger>
              </div>

              <div style={{ maxHeight: 600 }} className="overflow-auto">
                <CalendarWeekView />
              </div>
            </div>
          </Calendar>
        </Card>
      </div>
    </div>
  );
}
