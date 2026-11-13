import { z } from 'zod';
import { GENERATED_RBAC_FIELD_LIMITS } from '../rbac.constants';

const BundleCreateSchema = z.object({
    name: z.string().trim().min(1).max(GENERATED_RBAC_FIELD_LIMITS.NAME),
    label: z.string().trim().min(1).max(GENERATED_RBAC_FIELD_LIMITS.LABEL),
    hint: z
        .string()
        .trim()
        .max(GENERATED_RBAC_FIELD_LIMITS.HINT)
        .nullable(),
    is_system: z.boolean(),
});

const BundleUpdateSchema = z.object({
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

const BundlePermissionCreateSchema = z.object({
    bundle_id: z.number().int().positive(),
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

const RoleBundleCreateSchema = z.object({
    role_id: z.number().int().positive(),
    bundle_id: z.number().int().positive(),
});

export {
    BundleCreateSchema,
    BundlePermissionCreateSchema,
    BundleUpdateSchema,
    RoleBundleCreateSchema,
};
