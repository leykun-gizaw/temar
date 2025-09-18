import { z } from 'zod';

export const CalendarEventSchema = z.object({
  id: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  title: z.string(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const CalendarEventArraySchema = z.array(CalendarEventSchema);
export type CalendarEventParsed = z.infer<typeof CalendarEventSchema>;
