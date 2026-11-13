import { z } from 'zod';
import { RBAC_LIST_DEFAULTS } from '../rbac.constants.js';

const PageQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(RBAC_LIST_DEFAULTS.PAGE),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(RBAC_LIST_DEFAULTS.MAX_LIMIT)
        .default(RBAC_LIST_DEFAULTS.LIMIT),
    search: z.string().trim().optional().nullable(),
    sortOrder: z.enum(['ASC', 'DESC']).default(RBAC_LIST_DEFAULTS.SORT_ORDER),
});

const NameSortedPageQuerySchema = PageQuerySchema.extend({
    sortBy: z.enum(['name']).default(RBAC_LIST_DEFAULTS.SORT_BY),
});

const CatalogPageQuerySchema = PageQuerySchema.extend({
    sortBy: z
        .enum(['resource'])
        .default(RBAC_LIST_DEFAULTS.CATALOG_SORT_BY),
});

export { CatalogPageQuerySchema, NameSortedPageQuerySchema };
