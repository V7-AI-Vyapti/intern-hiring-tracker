import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileUploadRequestSchema = z.object({
    folderId: z.coerce.number().int().optional().nullable(),
    fileName: z.string().max(200).optional().nullable(),
});

export class FileUploadRequestDto extends createZodDto(
    FileUploadRequestSchema,
) {}
