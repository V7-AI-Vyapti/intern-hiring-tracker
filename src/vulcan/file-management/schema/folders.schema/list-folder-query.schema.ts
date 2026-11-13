import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FolderListQuerySchema = z.object({
    parentFolderId: z.number().int().optional().nullable().default(null),
});
export class FolderListQueryDto extends createZodDto(FolderListQuerySchema) {}
