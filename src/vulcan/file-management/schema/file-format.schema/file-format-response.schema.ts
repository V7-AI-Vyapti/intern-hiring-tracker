import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileFormatResponseSchema = z.object({
    fileFormatId: z.number().int(),
    fileFormatName: z.string(),
    description: z.string().nullable(),
});

export class FileFormatResponseDto extends createZodDto(
    FileFormatResponseSchema,
) {}
