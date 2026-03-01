import ScheduleCard from '@/components/schedule-card';
import ReviewsTableCard from '@/components/reviews-table-card';
import { Calendar, CalendarDayView } from '@/components/full-calendar';
import { EventsSummary } from '@/app/dashboard/_components/events-summary';
import { getAllCalendarEvents } from '@/lib/fetchers/events';
import {
  getDueRecallItems,
  getDueCount,
  getAllRecallItems,
} from '@/lib/fetchers/recall-items';
import {
  getTrackingStatus,
  getUnderperformingChunks,
  getOutdatedChunks,
} from '@/lib/actions/tracking';
import { getTopicsCount } from '@/lib/fetchers/topics';
import { getNotesCount } from '@/lib/fetchers/notes';
import { getChunksCount } from '@/lib/fetchers/chunks';
import GenerationQueueCard from '@/components/generation-queue-card';
import UnderperformingChunksCard from '@/components/underperforming-chunks-card';
import OutdatedQuestionsCard from '@/components/outdated-questions-card';
import { TopicStats } from '../_components/topic-stats';
import { NoteStats } from '../_components/note-stats';
import { ChunkStats } from '../_components/chunk-stats';
import { ReviewItemStats } from '../_components/review-item-stats';

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
    outdatedChunks,
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
    getOutdatedChunks(),
  ]);

  return (
    <div className="h-[calc(100svh-var(--header-height))] overflow-hidden flex flex-col lg:grid lg:grid-cols-[1fr_1fr_1fr_1fr_400px] lg:grid-rows-[auto_1fr_1fr_400px] gap-4 p-4">
      <EventsSummary
        dueItems={dueItems}
        className="col-start-1 col-end-2 row-start-1 row-end-2"
      />
      <div className="flex gap-4 justify-between col-start-2 col-end-5 row-start-1 row-end-2">
        <TopicStats
          topicsCount={topicsCount}
          trackedCount={trackedItems.length}
          className="flex-1"
        />
        <NoteStats notesCount={notesCount} className="flex-1" />
        <ChunkStats
          chunksCount={chunksCount}
          dueCount={dueCount}
          className="flex-1"
        />
        <ReviewItemStats dueCount={dueCount} className="flex-1" />
      </div>

      <UnderperformingChunksCard
        initialChunks={underperformingChunks}
        className="col-start-3 col-end-5 row-start-2 row-end-4"
      />
      <GenerationQueueCard
        initialItems={trackedItems}
        className="col-start-1 col-end-3 row-start-2 row-end-4"
      />

      <ReviewsTableCard
        items={allItemsResult.items}
        total={allItemsResult.total}
        className="col-start-1 col-end-5 row-start-4 row-end-5"
      />
      <div className="col-start-5 col-end-6 row-start-4 row-end-5">
        <OutdatedQuestionsCard
          initialChunks={outdatedChunks}
          className="h-full"
        />
      </div>

      <div className="flex-1 min-h-0 lg:row-span-3">
        <ScheduleCard dueCount={dueCount}>
          <Calendar events={calendarEvents}>
            <div className="p-4 h-full min-h-0">
              <CalendarDayView />
            </div>
          </Calendar>
        </ScheduleCard>
      </div>
    </div>
  );
}
