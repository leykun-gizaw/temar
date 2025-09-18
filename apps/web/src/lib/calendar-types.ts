import { Locale } from 'date-fns';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';

export type View = 'day' | 'week' | 'month' | 'year';

export type ContextType = {
  view: View;
  setView: (view: View) => void;
  date: Date;
  setDate: (date: Date) => void;
  events: CalendarEvent[];
  locale: Locale;
  setEvents: (date: CalendarEvent[]) => void;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
  enableHotkeys?: boolean;
  today: Date;
};

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  progress?: number;
};

export type CalendarProps = {
  children: ReactNode;
  defaultDate?: Date;
  events?: CalendarEvent[];
  view?: View;
  locale?: Locale;
  enableHotkeys?: boolean;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

export const monthEventVariants = cva(
  'rounded p-2 text-xs bg-primary/20 text-secondary-foreground'
);

export const dayEventVariants = cva(
  'rounded p-2 text-xs bg-primary/20 text-secondary-foreground'
);
