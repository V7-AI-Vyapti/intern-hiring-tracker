import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileResponseSchema = z.object({
    fileId: z.number().int(),
    fileName: z.string(),
    description: z.string(),
    fileUrl: z.string(),

    folderId: z.number().int().nullable(),

    fileMetaDataId: z.number().int().nullable(),
    fileMetaDataName: z.string().nullable(),
    mimeType: z.string().nullable(),
    fileSizeBytes: z.number().int().nullable(),
    bucketName: z.string().nullable(),
    storagePath: z.string().nullable(),
    metaCreatedAt: z.number().int().nullable(),
    metaUpdatedAt: z.number().int().nullable(),
});

export class FileResponseDto extends createZodDto(FileResponseSchema) {}
