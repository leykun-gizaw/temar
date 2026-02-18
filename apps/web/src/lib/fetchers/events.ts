import { CalendarEvent } from '../calendar-types';
import { getAllRecallItems, type RecallItemDue } from './recall-items';

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
    title: item.chunkName,
    progress,
  };
}

export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  const result = await getAllRecallItems({ limit: 200 });
  return result.items.map(toCalendarEvent);
}

export async function getCalendarEventById(
  id: string
): Promise<CalendarEvent | undefined> {
  const events = await getAllCalendarEvents();
  return events.find((e) => e.id === id);
}
