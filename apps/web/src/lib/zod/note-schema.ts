import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, { error: 'Please provide a name.' }),
  description: z
    .string()
    .min(1, { error: 'Please provide a description' })
    .max(500),
  slug: z
    .string()
    .trim()
    .min(1, { error: 'Slug is required.' })
    .max(100, { error: 'Slug must be at most 100 characters.' }),
  topicId: z.string().min(1, 'topicId is required'),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string().optional(),
});

export const NoteInputSchema = NoteSchema.omit({
  id: true,
  slug: true,
  topicId: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export type Note = z.infer<typeof NoteSchema>;
export type NoteInput = z.infer<typeof NoteInputSchema>;
