import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FileIdParamsSchema = z.object({
    fileId: z.coerce.number().int().min(1),
});

export class FileIdParamsDto extends createZodDto(FileIdParamsSchema) {}
