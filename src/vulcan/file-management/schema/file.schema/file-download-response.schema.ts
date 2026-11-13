import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileDownloadResponseSchema = z.object({
    downloadUrl: z.string(),
});
export class FileDownloadResponseDto extends createZodDto(
    FileDownloadResponseSchema,
) {}
