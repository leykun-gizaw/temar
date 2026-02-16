import ScheduleCard from '@/components/schedule-card';
import ReviewsTableCard from '@/components/reviews-table-card';
import { HeaderStats } from '@/components/header-stats';
import { Calendar, CalendarDayView } from '@/components/full-calendar';
import { EventsSummary } from '@/components/events-summary';
import { getAllCalendarEvents } from '@/lib/fetchers/events';
import { getTopicsCount } from '@/lib/fetchers/topics';
import { getNotesCount } from '@/lib/fetchers/notes';
import { getChunksCount } from '@/lib/fetchers/chunks';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const events = await getAllCalendarEvents();
  const topicsCount = await getTopicsCount();
  const notesCount = await getNotesCount();
  const chunksCount = await getChunksCount();

  return (
    <>
      <div className="flex flex-col gap-4 p-6 lg:h-full lg:min-h-[calc(100svh-3rem)]">
        <div className="flex justify-between">
          <h1 className="text-2xl shrink-0">Dashboard</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          <div className="flex flex-col w-full flex-grow gap-4">
            <EventsSummary events={events} />
            <HeaderStats
              topicsCount={topicsCount}
              notesCount={notesCount}
              chunksCount={chunksCount}
            />
            <ReviewsTableCard events={events} />
          </div>
          <ScheduleCard>
            <Calendar events={events}>
              <div className="p-4 h-full min-h-0">
                <CalendarDayView />
              </div>
            </Calendar>
          </ScheduleCard>
        </div>
      </div>
      <div className="w-full bg-muted h-10" />
    </>
  );
}
