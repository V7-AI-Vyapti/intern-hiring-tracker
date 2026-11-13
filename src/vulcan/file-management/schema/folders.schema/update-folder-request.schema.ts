import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FolderUpdateRequestSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(200).optional(),
    parentFolderId: z.coerce.number().int().optional().nullable(),
});
export class FolderUpdateRequestDto extends createZodDto(
    FolderUpdateRequestSchema,
) {}
