import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DataTabEntityItemSchema = z.object({
    entity_id: z.number().int(),
    entity_name: z.string(),
    description: z.string().nullable(),
    fields: z.unknown().nullable().optional(),
    entity_type_id: z.number().int().optional(),
});

export class DataTabEntityItemDto extends createZodDto(
    DataTabEntityItemSchema,
) {}

export type DataTabEntityItem = z.infer<typeof DataTabEntityItemSchema>;
