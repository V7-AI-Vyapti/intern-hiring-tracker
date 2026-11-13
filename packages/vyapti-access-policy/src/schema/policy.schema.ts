import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
    ACCESS_POLICY_FIELD_LIMITS,
    ACCESS_POLICY_MODES,
} from '../access-policy.constants.js';

const opaqueField = z
    .string()
    .trim()
    .min(1)
    .max(ACCESS_POLICY_FIELD_LIMITS.FIELD)
    .nullable()
    .optional();

const PolicyModeSchema = z.enum([
    ACCESS_POLICY_MODES.UNRESTRICTED,
    ACCESS_POLICY_MODES.FILTER,
    ACCESS_POLICY_MODES.DENY,
]);

const CreatePolicySchema = z.object({
    entity_name: z
        .string()
        .trim()
        .min(1)
        .max(ACCESS_POLICY_FIELD_LIMITS.ENTITY_NAME),
    mode: PolicyModeSchema,
    constraint_field: opaqueField,
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY)
        .nullable()
        .optional(),
});

const UpdatePolicySchema = z
    .object({
        mode: PolicyModeSchema.optional(),
        constraint_field: opaqueField,
        scope_key: z
            .string()
            .trim()
            .min(1)
            .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY)
            .nullable()
            .optional(),
    })
    .refine(hasPolicyUpdateField, {
        message: 'At least one policy field is required',
    });

function hasPolicyUpdateField(input: {
    mode?: string;
    constraint_field?: string | null;
    scope_key?: string | null;
}): boolean {
    return (
        input.mode !== undefined ||
        input.constraint_field !== undefined ||
        input.scope_key !== undefined
    );
}

class CreatePolicyRequestDto extends createZodDto(CreatePolicySchema) {}
class UpdatePolicyRequestDto extends createZodDto(UpdatePolicySchema) {}

export { CreatePolicyRequestDto, CreatePolicySchema, UpdatePolicyRequestDto };
