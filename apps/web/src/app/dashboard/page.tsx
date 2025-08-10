'use client';

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:[grid-template-rows:auto_1fr] gap-4">
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
        <div className="col-span-1 lg:col-span-1 border p-4 rounded-xl shadow-xs ">
          {/* Chart for reviews made vs revews missed */}
        </div>
        <div className="col-span-1 lg:col-span-1 border p-4 rounded-xl shadow-xs "></div>
        <div className="col-span-1 lg:col-span-3 border p-4 rounded-xl shadow-xs">
          <h1 className="font-semibold">This week at a glance</h1>
          <Calendar
            events={[
              {
                id: '1',
                start: new Date('2025-08-09T09:30:00Z'),
                end: new Date('2025-08-09T14:30:00Z'),
                title: 'event A',
                color: 'pink',
              },
              {
                id: '2',
                start: new Date('2025-08-09T10:00:00Z'),
                end: new Date('2025-08-09T10:30:00Z'),
                title: 'event B',
                color: 'blue',
              },
            ]}
          >
            <div className="py-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <CalendarViewTrigger
                  className="aria-[current=true]:bg-accent"
                  view="day"
                >
                  Day
                </CalendarViewTrigger>
                <CalendarViewTrigger
                  view="week"
                  className="aria-[current=true]:bg-accent"
                >
                  Week
                </CalendarViewTrigger>
                <CalendarViewTrigger
                  view="month"
                  className="aria-[current=true]:bg-accent"
                >
                  Month
                </CalendarViewTrigger>
                <CalendarViewTrigger
                  view="year"
                  className="aria-[current=true]:bg-accent"
                >
                  Year
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
                <CalendarDayView />
                <CalendarWeekView />
                <CalendarMonthView />
                <CalendarYearView />
              </div>
            </div>
          </Calendar>
        </div>
      </div>
    </div>
  );
}
