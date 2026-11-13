import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileUploadMetaSchema = z.object({
    url: z.string(),
    headers: z.record(z.string(), z.string()),
    expiresIn: z.number(),
});
export class FileUploadMetaDto extends createZodDto(FileUploadMetaSchema) {}
