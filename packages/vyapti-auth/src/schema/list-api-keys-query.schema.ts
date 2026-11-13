import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_LIST_DEFAULTS } from '../auth.constants.js';

const ApiKeyListSortBySchema = z.enum(['created_at', 'name']);
const ApiKeyListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default(AUTH_LIST_DEFAULTS.SORT_ORDER),
);

const ListApiKeysQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(AUTH_LIST_DEFAULTS.PAGE),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(AUTH_LIST_DEFAULTS.MAX_LIMIT)
        .default(AUTH_LIST_DEFAULTS.LIMIT),
    search: z.string().trim().optional().nullable(),
    sortBy: ApiKeyListSortBySchema.default(AUTH_LIST_DEFAULTS.SORT_BY),
    sortOrder: ApiKeyListSortOrderSchema,
});

class ListApiKeysQueryDto extends createZodDto(ListApiKeysQuerySchema) {}

type ListApiKeysQueryInput = z.infer<typeof ListApiKeysQuerySchema>;

export { ListApiKeysQueryDto, ListApiKeysQuerySchema };
export type { ListApiKeysQueryInput };
