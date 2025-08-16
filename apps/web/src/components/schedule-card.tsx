'use client';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, CalendarDayView } from '@/components/full-calendar';
import { calendar_events } from '@/app/dashboard/dummy-calendar-events-data';
import { CalendarDaysIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function ScheduleCard() {
  return (
    <Card className="flex flex-col h-full min-h-0 w-full lg:w-2xl md:w-full">
      <CardHeader>
        <CardTitle>Reviews Schedule</CardTitle>
        <CardDescription>5 Reviews scheduled for today</CardDescription>
        <CardAction>
          <Button variant={'outline'} asChild>
            <Link href={'/dashboard/reviews'}>
              <CalendarDaysIcon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0 flex-1 h-full min-h-0">
        <Calendar events={calendar_events}>
          <div className="p-4 h-full min-h-0">
            <CalendarDayView />
          </div>
        </Calendar>
      </CardContent>
    </Card>
  );
}
