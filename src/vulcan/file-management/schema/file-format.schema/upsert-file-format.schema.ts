import { z } from 'zod';

export const FileFormatUpsertSchema = z.object({
    file_format_name: z.string().trim().min(1).max(255),
    description: z.string().nullable(),
});
