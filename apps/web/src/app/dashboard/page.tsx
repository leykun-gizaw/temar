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
import { ChevronLeft, ChevronRight, PlaneTakeoffIcon } from 'lucide-react';

export default function Page() {
  return (
    <div className="flex flex-col p-6">
      <div className="flex items-center gap-4">
        <PlaneTakeoffIcon size={32} />
        <h1 className="text-3xl font-bold">Overview</h1>
      </div>
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

          <div style={{ maxHeight: 700 }} className="overflow-auto">
            <CalendarDayView />
            <CalendarWeekView />
            <CalendarMonthView />
            <CalendarYearView />
          </div>
        </div>
      </Calendar>
    </div>
  );
}
