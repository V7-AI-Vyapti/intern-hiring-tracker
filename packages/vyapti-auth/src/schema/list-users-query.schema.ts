import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
    AUTH_LIST_DEFAULTS,
    AUTH_USER_LIST_DEFAULTS,
} from '../auth.constants.js';

function uppercaseSortOrder(value: unknown): unknown {
    if (typeof value === 'string') {
        return value.toUpperCase();
    }
    return value;
}

const StaffUserListSortBySchema = z.enum(['email', 'display_name']);
const StaffUserListSortOrderSchema = z.preprocess(
    uppercaseSortOrder,
    z.enum(['ASC', 'DESC']).default(AUTH_USER_LIST_DEFAULTS.SORT_ORDER),
);

const ListUsersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(AUTH_LIST_DEFAULTS.PAGE),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(AUTH_LIST_DEFAULTS.MAX_LIMIT)
        .default(AUTH_LIST_DEFAULTS.LIMIT),
    search: z.string().trim().optional().nullable(),
    sortBy: StaffUserListSortBySchema.default(AUTH_USER_LIST_DEFAULTS.SORT_BY),
    sortOrder: StaffUserListSortOrderSchema,
});

class ListUsersQueryDto extends createZodDto(ListUsersQuerySchema) {}

export { ListUsersQueryDto, ListUsersQuerySchema };
