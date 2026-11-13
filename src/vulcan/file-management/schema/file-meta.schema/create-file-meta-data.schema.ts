import { z } from 'zod';

export const FileMetaDataCreateSchema = z.object({
    file_meta_data_name: z.string(),
    description: z.string(),
    mime_type: z.string(),
    file_size_bytes: z.number(),
    bucket_name: z.string(),
    storage_path: z.string(),
    file_id: z.number(),
    created_at: z.number(),
    updated_at: z.number(),
    folder_id: z.number().optional().nullable(),
});
