import { z } from 'zod';
import { GENERATED_ACCESS_POLICY_FIELD_LIMITS } from '../access-policy.constants';

const nullableField = z.string().trim().min(1).max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.FIELD).nullable();

const PolicyModeSchema = z.enum(['unrestricted', 'filter', 'deny']);

const PolicyCreateSchema = z.object({
    entity_name: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.ENTITY_NAME),
    mode: PolicyModeSchema,
    constraint_field: nullableField,
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY)
        .nullable(),
});

const PolicyUpdateSchema = z.object({
    mode: PolicyModeSchema.optional(),
    constraint_field: nullableField.optional(),
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY)
        .nullable()
        .optional(),
});

const MembershipCreateSchema = z.object({
    user_id: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.USER_ID),
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY),
    scope_id: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_ACCESS_POLICY_FIELD_LIMITS.SCOPE_ID),
});

export { MembershipCreateSchema, PolicyCreateSchema, PolicyUpdateSchema };
