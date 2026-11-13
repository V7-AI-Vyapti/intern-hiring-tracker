import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EntityNameParamsSchema = z.object({
    entityName: z.string().trim().min(1),
});

export class EntityNameParamsDto extends createZodDto(EntityNameParamsSchema) {}
