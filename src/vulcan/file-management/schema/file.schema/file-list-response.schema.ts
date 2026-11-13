import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FileResponseSchema } from './file-response.schema';

export const FileListResponseSchema = z.object({
    items: z.array(FileResponseSchema),
});
export class FileListResponseDto extends createZodDto(FileListResponseSchema) {}
