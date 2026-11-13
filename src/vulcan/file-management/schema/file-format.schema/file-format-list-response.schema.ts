import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FileFormatResponseSchema } from './file-format-response.schema';

export const FileFormatListResponseSchema = z.object({
    items: z.array(FileFormatResponseSchema),
});

export class FileFormatListResponseDto extends createZodDto(
    FileFormatListResponseSchema,
) {}
