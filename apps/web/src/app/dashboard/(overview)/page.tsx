import ScheduleCard from '@/components/schedule-card';
import ReviewsTableCard from '@/components/reviews-table-card';
import { HeaderStats } from '@/components/header-stats';
import { Calendar, CalendarDayView } from '@/components/full-calendar';
import { EventsSummary } from '@/components/events-summary';
import { getAllCalendarEvents } from '@/lib/fetchers/events';
import {
  getDueRecallItems,
  getDueCount,
  getAllRecallItems,
} from '@/lib/fetchers/recall-items';
import {
  getTrackingStatus,
  getUnderperformingChunks,
} from '@/lib/actions/tracking';
import { getTopicsCount } from '@/lib/fetchers/topics';
import { getNotesCount } from '@/lib/fetchers/notes';
import { getChunksCount } from '@/lib/fetchers/chunks';
import GenerationQueueCard from '@/components/generation-queue-card';
import UnderperformingChunksCard from '@/components/underperforming-chunks-card';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [
    dueItems,
    dueCount,
    allItemsResult,
    trackedItems,
    calendarEvents,
    topicsCount,
    notesCount,
    chunksCount,
    underperformingChunks,
  ] = await Promise.all([
    getDueRecallItems({ limit: 50 }),
    getDueCount(),
    getAllRecallItems({ limit: 10, offset: 0 }),
    getTrackingStatus(),
    getAllCalendarEvents(),
    getTopicsCount(),
    getNotesCount(),
    getChunksCount(),
    getUnderperformingChunks(),
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 p-6 lg:h-full lg:min-h-[calc(100svh-3rem)]">
        <div className="flex justify-between gap-8">
          <EventsSummary dueItems={dueItems} />
          <HeaderStats
            topicsCount={topicsCount}
            notesCount={notesCount}
            chunksCount={chunksCount}
            trackedCount={trackedItems.length}
            dueCount={dueCount}
          />
        </div>
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          <div className="flex flex-col w-full flex-grow gap-4">
            <div className="flex justify-between grow gap-4">
              <UnderperformingChunksCard
                initialChunks={underperformingChunks}
              />
              <GenerationQueueCard initialItems={trackedItems} />
            </div>
            <ReviewsTableCard
              items={allItemsResult.items}
              total={allItemsResult.total}
            />
          </div>
          <ScheduleCard dueCount={dueCount}>
            <Calendar events={calendarEvents}>
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
