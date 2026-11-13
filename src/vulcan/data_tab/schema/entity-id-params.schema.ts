import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EntityIdParamsSchema = z.object({
    entityId: z.coerce.number().int().min(1),
});

export class EntityIdParamsDto extends createZodDto(EntityIdParamsSchema) {}
