import { z } from 'zod';
import { GENERATED_RBAC_FIELD_LIMITS } from '../rbac.constants';

const RoleCreateSchema = z.object({
    name: z.string().trim().min(1).max(GENERATED_RBAC_FIELD_LIMITS.NAME),
    label: z.string().trim().min(1).max(GENERATED_RBAC_FIELD_LIMITS.LABEL),
    hint: z
        .string()
        .trim()
        .max(GENERATED_RBAC_FIELD_LIMITS.HINT)
        .nullable(),
    is_system: z.boolean(),
    full_access: z.boolean(),
});

const RoleUpdateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_RBAC_FIELD_LIMITS.NAME)
        .optional(),
    label: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_RBAC_FIELD_LIMITS.LABEL)
        .optional(),
    hint: z
        .string()
        .trim()
        .max(GENERATED_RBAC_FIELD_LIMITS.HINT)
        .nullable()
        .optional(),
});

export { RoleCreateSchema, RoleUpdateSchema };
