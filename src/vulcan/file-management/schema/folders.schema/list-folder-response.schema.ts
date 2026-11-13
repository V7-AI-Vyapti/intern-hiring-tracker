import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FolderResponseSchema } from './folder-response.schema';

export const FolderListResponseSchema = z.object({
    items: z.array(FolderResponseSchema),
});
export class FolderListResponseDto extends createZodDto(
    FolderListResponseSchema,
) {}
