import { CalendarEvent } from '../calendar-types';
import {
  getAllRecallItems,
  getReviewLogs,
  type RecallItemDue,
  type ReviewLogEntry,
} from './recall-items';

/**
 * Map a RecallItemDue into a CalendarEvent so the existing
 * Calendar / CalendarDayView components can render it.
 */
function toCalendarEvent(item: RecallItemDue): CalendarEvent {
  const due = new Date(item.due);
  const end = new Date(due);
  end.setMinutes(end.getMinutes() + 30);

  // Approximate retrievability as a percentage from stability
  const progress = item.stability
    ? Math.min(100, Math.round((item.stability / (item.stability + 1)) * 100))
    : 0;

  return {
    id: item.id,
    start: due,
    end,
    title: item.questionTitle || item.chunkName,
    progress,
    color: 'blue',
  };
}

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

function reviewLogToCalendarEvent(log: ReviewLogEntry): CalendarEvent {
  const start = new Date(log.reviewedAt);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Math.max(5, (log.durationMs ?? 0) / 60000));

  return {
    id: `log-${log.id}`,
    start,
    end,
    title: `Reviewed (${RATING_LABELS[log.rating] ?? log.rating})`,
    color: 'green',
  };
}

export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recallResult, reviewLogs] = await Promise.all([
    getAllRecallItems({ limit: 200 }),
    getReviewLogs(thirtyDaysAgo, now),
  ]);

  const dueEvents = recallResult.items.map(toCalendarEvent);
  const logEvents = reviewLogs.map(reviewLogToCalendarEvent);

  return [...dueEvents, ...logEvents];
}

export async function getCalendarEventById(
  id: string
): Promise<CalendarEvent | undefined> {
  const events = await getAllCalendarEvents();
  return events.find((e) => e.id === id);
}
