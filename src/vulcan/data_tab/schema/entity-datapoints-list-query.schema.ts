import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DataTabEntityDatapointsListSortBySchema = z.enum([
    'createdAt',
    'updatedAt',
]);
export const DataTabEntityDatapointsListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('DESC'),
);

export const DataTabEntityDatapointsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: DataTabEntityDatapointsListSortBySchema.default('createdAt'),
    sortOrder: DataTabEntityDatapointsListSortOrderSchema,
});

export class DataTabEntityDatapointsListQueryDto extends createZodDto(
    DataTabEntityDatapointsListQuerySchema,
) {}
