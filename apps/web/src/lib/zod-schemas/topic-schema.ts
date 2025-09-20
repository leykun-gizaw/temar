import { z } from 'zod';

export const TopicSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  userId: z.uuid(),
});

export type Topic = z.infer<typeof TopicSchema>;

// Assuming you already have TopicSchema defined elsewhere.
// Define (or export) a focused input schema with stronger constraints.
export const TopicInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters'),
});
export type TopicInput = z.infer<typeof TopicInputSchema>;
