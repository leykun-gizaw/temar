import { z } from 'zod';

export const TopicSchema = z.object({
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
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  userId: z.uuid(),
});

export const TopicInputSchema = TopicSchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export type Topic = z.infer<typeof TopicSchema>;
export type TopicInput = z.infer<typeof TopicInputSchema>;
