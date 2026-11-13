import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExcelToCsvEnqueueResponseSchema = z.object({
    job_id: z.string(),
    status: z.literal('queued'),
});

export class ExcelToCsvEnqueueResponseDto extends createZodDto(
    ExcelToCsvEnqueueResponseSchema,
) {}
