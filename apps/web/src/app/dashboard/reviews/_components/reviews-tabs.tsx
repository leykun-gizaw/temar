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
      <div className="shrink-0 px-5 pt-4 pb-2">
        <TabsList className="h-9 bg-muted/60 p-1 rounded-full gap-1 shadow-sm">
          <TabsTrigger
            value="active"
            className="h-full rounded-full px-4 gap-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
          >
            <Brain className="h-3.5 w-3.5" />
            Active Reviews
            {dueCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] leading-none">
                {dueCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-full rounded-full px-4 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
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
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Brain className="h-8 w-8 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No items due for review</p>
              <p className="text-xs opacity-70 mt-1">
                Check back later or browse your review history.
              </p>
            </div>
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
