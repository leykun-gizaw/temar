import { z } from 'zod';

const notionIdRegex =
  /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/;

export const MasterPageInputSchema = z.object({
  notionMasterPageId: z
    .string()
    .min(32, 'ID is too short')
    .max(36, 'ID is too long')
    .refine((val) => notionIdRegex.test(val), {
      message: 'Invalid Notion Page ID format',
    })
    // Crucial: Notion's API usually expects the version WITH hyphens
    .transform((val) => {
      const clean = val.replace(/-/g, '');
      if (clean.length !== 32) return val;

      // Re-insert hyphens into the 8-4-4-4-12 structure
      return [
        clean.substring(0, 8),
        clean.substring(8, 12),
        clean.substring(12, 16),
        clean.substring(16, 20),
        clean.substring(20),
      ]
        .join('-')
        .toLowerCase();
    }),
});

export type MasterPageInputParsed = z.infer<typeof MasterPageInputSchema>;
