import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ACCESS_POLICY_LIST_DEFAULTS } from '../access-policy.constants.js';

const PageQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(ACCESS_POLICY_LIST_DEFAULTS.PAGE),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(ACCESS_POLICY_LIST_DEFAULTS.MAX_LIMIT)
        .default(ACCESS_POLICY_LIST_DEFAULTS.LIMIT),
    search: z.string().trim().optional().nullable(),
    sortOrder: z
        .enum(['ASC', 'DESC'])
        .default(ACCESS_POLICY_LIST_DEFAULTS.SORT_ORDER),
});

const PolicyPageQuerySchema = PageQuerySchema.extend({
    sortBy: z
        .enum(['entity_name'])
        .default(ACCESS_POLICY_LIST_DEFAULTS.POLICY_SORT_BY),
});

const MembershipPageQuerySchema = PageQuerySchema.extend({
    sortBy: z
        .enum(['scope_key', 'scope_id'])
        .default(ACCESS_POLICY_LIST_DEFAULTS.MEMBERSHIP_SORT_BY),
    user_id: z.string().trim().min(1).optional(),
    scope_key: z.string().trim().min(1).optional(),
});

class ListPoliciesQueryDto extends createZodDto(PolicyPageQuerySchema) {}
class ListMembershipsQueryDto extends createZodDto(MembershipPageQuerySchema) {}

export { ListMembershipsQueryDto, ListPoliciesQueryDto };
