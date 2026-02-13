import { z } from 'zod';

export const ChunkInputSchema = z.object({
  title: z.string().min(1, { error: 'Please provide a name.' }),
  description: z
    .string()
    .min(1, { error: 'Please provide a description.' })
    .max(500),
});

export type ChunkInput = z.infer<typeof ChunkInputSchema>;
