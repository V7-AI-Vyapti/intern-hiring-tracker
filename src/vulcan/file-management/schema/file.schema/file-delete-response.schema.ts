import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileDeleteResponseSchema = z.object({
    deleted: z.boolean(),
    fileId: z.number().int(),
});
export class FileDeleteResponseDto extends createZodDto(
    FileDeleteResponseSchema,
) {}
