import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DataTabEntityListSortBySchema = z.enum(['entityName']);
export const DataTabEntityListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('ASC'),
);

export const DataTabEntityListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: DataTabEntityListSortBySchema.default('entityName'),
    sortOrder: DataTabEntityListSortOrderSchema,
});

export class DataTabEntityListQueryDto extends createZodDto(
    DataTabEntityListQuerySchema,
) {}
