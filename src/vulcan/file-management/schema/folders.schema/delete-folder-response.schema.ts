import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FolderDeleteResponseSchema = z.object({
    deleted: z.literal(true),
    id: z.coerce.number().int(),
});
export class FolderDeleteResponseDto extends createZodDto(
    FolderDeleteResponseSchema,
) {}
