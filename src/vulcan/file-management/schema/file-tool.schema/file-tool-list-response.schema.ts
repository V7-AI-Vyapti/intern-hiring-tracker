import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FileToolResponseSchema } from './file-tool-response.schema';

export const FileToolListResponseSchema = z.object({
    items: z.array(FileToolResponseSchema),
});

export class FileToolListResponseDto extends createZodDto(
    FileToolListResponseSchema,
) {}
