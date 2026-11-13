import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProcessDetailsSchema = z.object({
    process_id: z.number().int(),
    process_name: z.string(),
    description: z.string().nullable(),
    process_metadata: z.unknown().nullable(),
    process_result_json: z.unknown().nullable(),
    process_error_json: z.unknown().nullable(),
    tool_id: z.number().int(),
    process_status_id: z.number().int(),
    process_status_name: z.string().nullable(),
});

export class ProcessDetailsDto extends createZodDto(ProcessDetailsSchema) {}

export type ProcessDetailsItem = z.infer<typeof ProcessDetailsSchema>;
