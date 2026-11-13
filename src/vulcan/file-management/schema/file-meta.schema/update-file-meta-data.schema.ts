import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileMetaDataUpdateSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    mimeType: z.string().trim().min(1).max(120).optional(),
    fileSizeBytes: z.coerce.number().int().min(0).optional(),
    fileName: z.string().trim().min(1).max(200).optional(),
    bucketName: z.string().trim().min(1).max(200).optional(),
    storagePath: z.string().trim().min(1).max(500).optional(),
    folderId: z.coerce.number().int().optional().nullable(),
});
export class FileMetaDataUpdateDto extends createZodDto(
    FileMetaDataUpdateSchema,
) {}
