import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProcessListSortBySchema = z.enum(['processId', 'processName']);
export const ProcessListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('ASC'),
);

export const ProcessListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: ProcessListSortBySchema.default('processId'),
    sortOrder: ProcessListSortOrderSchema,
});

export class ProcessListQueryDto extends createZodDto(ProcessListQuerySchema) {}
