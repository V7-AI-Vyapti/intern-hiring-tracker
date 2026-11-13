import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FileMetaDataListRequestSchema = z.object({
    fileId: z.number().optional().nullable(),
});

export class FileMetaDataListRequestDto extends createZodDto(
    FileMetaDataListRequestSchema,
) {}
