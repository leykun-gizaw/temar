import ReviewsTableCard from '@/components/reviews-table-card';
import { DueNowCardStack } from '@/app/dashboard/_components/due-now-card-stack';
import { UpcomingSessions } from '../_components/upcoming-sessions';
import {
  getDueRecallItems,
  getDueCount,
  getAllRecallItems,
} from '@/lib/fetchers/recall-items';
import {
  getTrackingStatus,
} from '@/lib/actions/tracking';
import { getTopicsCount } from '@/lib/fetchers/topics';
import { getNotesCount } from '@/lib/fetchers/notes';
import { getChunksCount } from '@/lib/fetchers/chunks';
import { getDashboardStats } from '@/lib/fetchers/dashboard-stats';
import GenerationQueueCard from '@/components/generation-queue-card';
import { TopicStats } from '../_components/topic-stats';
import { NoteStats } from '../_components/note-stats';
import { ChunkStats } from '../_components/chunk-stats';
import { ReviewItemStats } from '../_components/review-item-stats';
import { GrowthOverview } from '../_components/growth-overview';
import { ConsistencyCard } from '../_components/consistency-card';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { getLoggedInUser } from '@/lib/fetchers/users';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const loggedInUser = await getLoggedInUser();

  const [
    dueItems,
    dueCount,
    allItemsResult,
    scheduleItemsResult,
    trackedItems,
    topicsCount,
    notesCount,
    chunksCount,
    dashboardStats,
  ] = await Promise.all([
    getDueRecallItems({ limit: 50 }),
    getDueCount(),
    getAllRecallItems({ limit: 10, offset: 0 }),
    getAllRecallItems({ limit: 500 }),
    getTrackingStatus(),
    getTopicsCount(),
    getNotesCount(),
    getChunksCount(),
    loggedInUser ? getDashboardStats(loggedInUser.id) : null,
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-5 h-[calc(100svh-var(--header-height))] overflow-auto">
      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Welcome + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Welcome back{loggedInUser?.name ? `, ${loggedInUser.name.split(' ')[0]}` : ''}.
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Your cognitive garden is thriving today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/materials"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors active:scale-95 shadow-md"
            >
              <FileText className="w-4 h-4" />
              New Note
            </Link>
            <Link
              href="/dashboard/reviews"
              className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Start Session
            </Link>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <DueNowCardStack dueItems={dueItems} />
          <TopicStats
            topicsCount={topicsCount}
            trackedCount={trackedItems.length}
          />
          <NoteStats notesCount={notesCount} />
          <ChunkStats chunksCount={chunksCount} dueCount={dueCount} />
          <ReviewItemStats dueCount={dueCount} />
        </div>

        {/* Growth Overview */}
        {dashboardStats && (
          <GrowthOverview stats={dashboardStats.growth} />
        )}

        {/* Recall Items Table */}
        <ReviewsTableCard
          items={allItemsResult.items}
          total={allItemsResult.total}
        />
      </div>

      {/* Right Sidebar Column */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5">
        {dashboardStats && (
          <ConsistencyCard stats={dashboardStats.consistency} />
        )}

        <UpcomingSessions
          allItems={scheduleItemsResult.items}
          dueItems={dueItems}
          dueCount={dueCount}
        />

        <GenerationQueueCard initialItems={trackedItems} />
      </div>
    </div>
  );
}
