import { z } from 'zod';
import { GENERATED_RBAC_FIELD_LIMITS } from '../rbac.constants';

const PermissionCreateSchema = z.object({
    role_id: z.number().int().positive(),
    entity_name: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_RBAC_FIELD_LIMITS.RESOURCE),
    operation: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_RBAC_FIELD_LIMITS.ACTION),
});

export { PermissionCreateSchema };
