import { z } from 'zod';

export const FileFileFormatMapCreateSchema = z.object({
    file_file_format_map_name: z.string().trim().min(1).max(255),
    description: z.string(),
    file_id: z.number().int(),
    file_format_id: z.number().int(),
});
