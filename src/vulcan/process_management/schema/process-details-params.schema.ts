import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProcessDetailsParamsSchema = z.object({
    processId: z.coerce.number().int().min(1),
});

export class ProcessDetailsParamsDto extends createZodDto(
    ProcessDetailsParamsSchema,
) {}
