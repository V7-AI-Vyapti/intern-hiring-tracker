import { z } from 'zod';
import { RBAC_FIELD_LIMITS } from '../rbac.constants.js';

const GrantSchema = z.object({
    resource: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.RESOURCE),
    action: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.ACTION),
});

const GrantListSchema = z.object({
    permissions: z.array(GrantSchema).max(RBAC_FIELD_LIMITS.GRANT_LIST),
});

export { GrantListSchema, GrantSchema };
