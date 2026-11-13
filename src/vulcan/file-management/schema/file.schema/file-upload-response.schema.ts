import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FileUploadMetaSchema } from './file-upload-meta.schema';

export const FileUploadResponseSchema = z.object({
    fileId: z.number(),
    upload: FileUploadMetaSchema,
});
export class FileUploadResponseDto extends createZodDto(
    FileUploadResponseSchema,
) {}
