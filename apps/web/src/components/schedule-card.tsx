'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  CalendarDayView,
  CalendarWeekView,
} from '@/components/full-calendar';
import { calendar_events } from '@/app/dashboard/dummy-calendar-events-data';

export function ScheduleCard() {
  const [view, setView] = useState<'day' | 'week'>('day');

  return (
    <Card className="flex flex-col h-full min-h-0 w-full lg:w-2xl md:w-full">
      <CardHeader className="border-b">
        <CardTitle>Reviews Schedule</CardTitle>
        <div className="mt-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as 'day' | 'week')}
          >
            <TabsList>
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
        {/* key forces Calendar to re-initialize when view changes */}
        <Calendar key={view} view={view} events={calendar_events}>
          <div className="p-4">
            {view === 'day' ? <CalendarDayView /> : <CalendarWeekView />}
          </div>
        </Calendar>
      </CardContent>
    </Card>
  );
}

export default ScheduleCard;
