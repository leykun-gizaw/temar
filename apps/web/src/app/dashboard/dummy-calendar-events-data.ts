import { type CalendarEvent } from '@/components/full-calendar';

export const calendar_events: CalendarEvent[] = [
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
];
