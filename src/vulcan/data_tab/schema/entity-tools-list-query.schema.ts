import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DataTabEntityToolsListSortBySchema = z.enum([
    'configuredToolName',
    'createdAt',
    'updatedAt',
]);
export const DataTabEntityToolsListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('ASC'),
);

export const DataTabEntityToolsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: DataTabEntityToolsListSortBySchema.default('configuredToolName'),
    sortOrder: DataTabEntityToolsListSortOrderSchema,
});

export class DataTabEntityToolsListQueryDto extends createZodDto(
    DataTabEntityToolsListQuerySchema,
) {}
