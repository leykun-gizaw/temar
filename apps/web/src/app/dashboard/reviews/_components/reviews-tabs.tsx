'use client';

import { Brain } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReviewSession from './review-session';
import ReviewHistory from './review-history';
import type { RecallItemDue } from '@/lib/fetchers/recall-items';

interface ReviewsTabsProps {
  dueItems: RecallItemDue[];
  dueCount: number;
  allItems: RecallItemDue[];
  answerDrafts: Record<string, unknown>;
  topics: Array<{ id: string; name: string }>;
  currentTopicId?: string;
  currentNoteId?: string;
}

export default function ReviewsTabs({
  dueItems,
  dueCount,
  allItems,
  answerDrafts,
  topics,
  currentTopicId,
  currentNoteId,
}: ReviewsTabsProps) {
  const defaultTab = dueCount > 0 ? 'active' : 'history';

  return (
    <Tabs
      defaultValue={defaultTab}
      className="h-[calc(100vh-var(--header-height))] flex flex-col gap-0"
    >
      <div className="border-b bg-card shrink-0 px-4">
        <TabsList className="h-10 bg-transparent p-0 gap-1 rounded-none">
          <TabsTrigger
            value="active"
            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-sm"
          >
            <Brain className="h-4 w-4" />
            Active Reviews
            {dueCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold px-2 py-0.5 min-w-[20px] leading-none">
                {dueCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 text-sm"
          >
            History
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="active" className="flex-1 min-h-0 mt-0">
        {dueItems.length > 0 ? (
          <ReviewSession
            initialItems={dueItems}
            initialDrafts={answerDrafts}
            topics={topics}
            currentTopicId={currentTopicId}
            currentNoteId={currentNoteId}
            dueCount={dueCount}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Brain className="h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">No items due for review</p>
            <p className="text-xs opacity-70">
              Check back later or browse your review history.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="flex-1 min-h-0 mt-0">
        <ReviewHistory
          allItems={allItems}
          topics={topics}
          currentTopicId={currentTopicId}
        />
      </TabsContent>
    </Tabs>
  );
}
