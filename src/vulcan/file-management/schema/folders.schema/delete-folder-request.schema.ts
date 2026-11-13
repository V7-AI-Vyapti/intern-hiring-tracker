import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const DeleteFolderRequestSchema = z.object({
    folderId: z.coerce.number().int(),
});
export class DeleteFolderRequestDto extends createZodDto(
    DeleteFolderRequestSchema,
) {}
