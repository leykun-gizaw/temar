'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarEvent,
  CalendarProps,
  ContextType,
  dayEventVariants,
  monthEventVariants,
  View,
} from '@/lib/calendar-types';
import { cn } from '@/lib/utils';
import {
  Locale,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInMinutes,
  format,
  getMonth,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  setHours,
  setMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import {
  createContext,
  ButtonHTMLAttributes,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

const Context = createContext<ContextType>({} as ContextType);

const Calendar = ({
  children,
  defaultDate = new Date(),
  locale = enUS,
  enableHotkeys = true,
  view: _defaultMode = 'day',
  onEventClick,
  events: defaultEvents = [],
  onChangeView,
}: CalendarProps) => {
  const [view, setView] = useState<View>(_defaultMode);
  const [date, setDate] = useState(defaultDate);
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);

  const changeView = (view: View) => {
    setView(view);
    onChangeView?.(view);
  };

  useHotkeys('m', () => changeView('month'), {
    enabled: enableHotkeys,
  });

  useHotkeys('w', () => changeView('week'), {
    enabled: enableHotkeys,
  });

  useHotkeys('y', () => changeView('year'), {
    enabled: enableHotkeys,
  });

  useHotkeys('d', () => changeView('day'), {
    enabled: enableHotkeys,
  });

  return (
    <Context.Provider
      value={{
        view,
        setView,
        date,
        setDate,
        events,
        setEvents,
        locale,
        enableHotkeys,
        onEventClick,
        onChangeView,
        today: new Date(),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useCalendar = () => useContext(Context);

const CalendarViewTrigger = ({
  children,
  view,
  ...props
}: {
  view: View;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { view: currentView, setView, onChangeView } = useCalendar();

  return (
    <Button
      aria-current={currentView === view}
      size="sm"
      variant="ghost"
      {...props}
      onClick={() => {
        setView(view);
        onChangeView?.(view);
      }}
    >
      {children}
    </Button>
  );
};
CalendarViewTrigger.displayName = 'CalendarViewTrigger';

const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
  const timeIndicator = (
    <div
      className="absolute h-[2px] bg-primary w-full"
      style={{
        top: `${(now.getMinutes() / 60) * 100}%`,
      }}
    >
      <div
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '0.5rem solid transparent',
          borderBottom: '0.5rem solid transparent',
          borderLeft: '0.5rem solid var(--primary)',
        }}
      ></div>
    </div>
  );

  return (
    <div className="relative h-20 border-t last:border-b">
      {now.getHours() === hour.getHours() && now.getDate() === hour.getDate()
        ? timeIndicator
        : ''}
      {events
        .filter((event) => isSameHour(event.start, hour))
        .map((event) => {
          const hoursDifference =
            differenceInMinutes(event.end, event.start) / 60;
          const startPosition = event.start.getMinutes() / 60;

          return (
            <div
              key={event.id}
              className={cn('relative', dayEventVariants())}
              style={{
                top: `${startPosition * 100}%`,
                height: `${hoursDifference * 100}%`,
              }}
            >
              {event.title}
            </div>
          );
        })}
    </div>
  );
};

const CalendarDayView = () => {
  const { view, events, date, locale } = useCalendar();
  const weekStartsOn = startOfWeek(date, { weekStartsOn: 1 });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hours = [...Array(24)].map((_, i) => setHours(date, i));
  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(weekStartsOn, i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [weekStartsOn]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const target = (el.scrollHeight - el.clientHeight) * (2 / 3);
      el.scrollTop = target;
    });
  }, []);

  if (view !== 'day') return null;
  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <span className="font-semibold text-sm">{format(date, 'MMM yyyy')}</span>
      <div className="flex bg-card z-10 border-b pb-3 mb-3 sticky top-0 gap-2">
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              'text-center flex-1 gap-1 p-2 text-sm text-muted-foreground flex flex-col items-center justify-center border rounded-xl',
              [5, 6].includes(i) && 'text-muted-foreground/50',
              isToday(date) && 'text-primary border-primary'
            )}
          >
            <span className={cn('h-6 grid place-content-center')}>
              {format(date, 'd')}
            </span>
            {format(date, 'E', { locale })}
          </div>
        ))}
      </div>
      <div className="flex py-4 overflow-auto min-h-0" ref={scrollRef}>
        <TimeTable />
        <div className="flex-1">
          {hours.map((hour) => (
            <EventGroup key={hour.toString()} hour={hour} events={events} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CalendarWeekView = () => {
  const { view, date, locale, events } = useCalendar();
  const weekStartsOn = startOfWeek(date, { weekStartsOn: 1 });

  const weekDates = useMemo(() => {
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStartsOn, i);
      const hours = [...Array(24)].map((_, i) => setHours(day, i));
      weekDates.push(hours);
    }

    return weekDates;
  }, [weekStartsOn]);

  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(weekStartsOn, i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [weekStartsOn]);

  // console.log(weekDates[0][0]);
  if (view !== 'week') return null;

  return (
    <>
      <div className="flex bg-card z-10 border-b mb-3 sticky top-0">
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              'text-center flex-1 gap-1 pb-2 text-sm text-muted-foreground flex flex-col items-center justify-center',
              [5, 6].includes(i) && 'text-muted-foreground/50'
            )}
          >
            {format(date, 'E', { locale })}
            <span
              className={cn(
                'h-6 grid place-content-center',
                isToday(date) &&
                  'bg-primary text-primary-foreground rounded-full size-6'
              )}
            >
              {format(date, 'd')}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        <div className="w-fit">
          <TimeTable />
        </div>
        <div className="grid grid-cols-7 flex-1">
          {weekDates.map((hours, i) => {
            return (
              <div
                className={cn(
                  'h-full text-sm text-muted-foreground border-l first:border-l-0',
                  [5, 6].includes(i) && 'bg-muted/50'
                )}
                key={hours[0].toString()}
              >
                {hours.map((hour) => (
                  <EventGroup
                    key={hour.toString()}
                    hour={hour}
                    events={events}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const CalendarMonthView = () => {
  const { date, view, events, locale } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== 'month') return null;

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px sticky top-0 bg-background border-b">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              'mb-2 text-right text-sm text-muted-foreground pr-2',
              [0, 6].includes(i) && 'text-muted-foreground/50'
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid overflow-hidden -mt-px flex-1 auto-rows-fr p-px grid-cols-7 gap-px">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date)
          );

          return (
            <div
              className={cn(
                'ring-1 p-2 text-sm text-muted-foreground ring-border overflow-auto',
                !isSameMonth(date, _date) && 'text-muted-foreground/50'
              )}
              key={_date.toString()}
            >
              <span
                className={cn(
                  'size-6 grid place-items-center rounded-full mb-1 sticky top-0',
                  isToday(_date) && 'bg-primary text-primary-foreground'
                )}
              >
                {format(_date, 'd')}
              </span>

              {currentEvents.map((event) => {
                return (
                  <div
                    key={event.id}
                    className="px-1 rounded text-sm flex items-center gap-1"
                  >
                    <div className={cn('shrink-0', monthEventVariants())}></div>
                    <span className="flex-1 truncate">{event.title}</span>
                    <time className="tabular-nums text-muted-foreground/50 text-xs">
                      {format(event.start, 'HH:mm')}
                    </time>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarYearView = () => {
  const { view, date, today, locale } = useCalendar();

  const months = useMemo(() => {
    if (!view) {
      return [];
    }

    return Array.from({ length: 12 }).map((_, i) => {
      return getDaysInMonth(setMonth(date, i));
    });
  }, [date, view]);

  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== 'year') return null;

  return (
    <div className="grid grid-cols-4 gap-10 overflow-auto h-full">
      {months.map((days, i) => (
        <div key={days[0].toString()}>
          <span className="text-xl">{i + 1}</span>

          <div className="grid grid-cols-7 gap-2 my-5">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-x-2 text-center grid-cols-7 text-xs tabular-nums">
            {days.map((_date) => {
              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    getMonth(_date) !== i && 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'aspect-square grid place-content-center size-full tabular-nums',
                      isSameDay(today, _date) &&
                        getMonth(_date) === i &&
                        'bg-primary text-primary-foreground rounded-full'
                    )}
                  >
                    {format(_date, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const CalendarNextTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  const next = useCallback(() => {
    if (view === 'day') {
      setDate(addDays(date, 1));
    } else if (view === 'week') {
      setDate(addWeeks(date, 1));
    } else if (view === 'month') {
      setDate(addMonths(date, 1));
    } else if (view === 'year') {
      setDate(addYears(date, 1));
    }
  }, [date, view, setDate]);

  useHotkeys('ArrowRight', () => next(), {
    enabled: enableHotkeys,
  });

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        next();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarNextTrigger.displayName = 'CalendarNextTrigger';

const CalendarPrevTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  useHotkeys('ArrowLeft', () => prev(), {
    enabled: enableHotkeys,
  });

  const prev = useCallback(() => {
    if (view === 'day') {
      setDate(subDays(date, 1));
    } else if (view === 'week') {
      setDate(subWeeks(date, 1));
    } else if (view === 'month') {
      setDate(subMonths(date, 1));
    } else if (view === 'year') {
      setDate(subYears(date, 1));
    }
  }, [date, view, setDate]);

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        prev();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarPrevTrigger.displayName = 'CalendarPrevTrigger';

const CalendarTodayTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { setDate, enableHotkeys, today } = useCalendar();

  useHotkeys('t', () => jumpToToday(), {
    enabled: enableHotkeys,
  });

  const jumpToToday = useCallback(() => {
    setDate(today);
  }, [today, setDate]);

  return (
    <Button
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        jumpToToday();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
});
CalendarTodayTrigger.displayName = 'CalendarTodayTrigger';

const CalendarCurrentDate = () => {
  const { date, view } = useCalendar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <time dateTime={date.toISOString()} className="tabular-nums">
      {format(date, view === 'day' ? 'dd MMMM yyyy' : 'MMMM yyyy')}
    </time>
  );
};

const TimeTable = () => {
  return (
    <div className="pr-2 w-12">
      {Array.from(Array(25).keys()).map((hour) => {
        return (
          <div
            className="text-right relative text-xs text-muted-foreground/50 h-20 last:h-0"
            key={hour}
          >
            <p className=" top-0 -translate-y-1/2">
              {hour === 24 ? 0 : hour}:00
            </p>
          </div>
        );
      })}
    </div>
  );
};

const getDaysInMonth = (date: Date) => {
  const startOfMonthDate = startOfMonth(date);
  const startOfWeekForMonth = startOfWeek(startOfMonthDate, {
    weekStartsOn: 0,
  });

  let currentDate = startOfWeekForMonth;
  const calendar = [];

  while (calendar.length < 42) {
    calendar.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return calendar;
};

const generateWeekdays = (locale: Locale) => {
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i);
    daysOfWeek.push(format(date, 'EEEEEE', { locale }));
  }
  return daysOfWeek;
};

export {
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
};
