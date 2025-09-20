import { z } from 'zod';

export const NoteInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  topicId: z.string().min(1, 'topicId is required'),
});

export const NoteSchema = NoteInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string().optional(),
});

export type Note = z.infer<typeof NoteSchema>;
export type NoteInput = z.infer<typeof NoteInputSchema>;
