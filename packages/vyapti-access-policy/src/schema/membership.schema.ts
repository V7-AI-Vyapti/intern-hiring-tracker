import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ACCESS_POLICY_FIELD_LIMITS } from '../access-policy.constants.js';

const scopeIdSchema = z
    .string()
    .trim()
    .min(1)
    .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_ID);

const CreateMembershipSchema = z.object({
    user_id: z.string().trim().min(1).max(ACCESS_POLICY_FIELD_LIMITS.USER_ID),
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY),
    scope_id: scopeIdSchema,
});

const CreateMembershipsSchema = z.object({
    user_id: z.string().trim().min(1).max(ACCESS_POLICY_FIELD_LIMITS.USER_ID),
    scope_key: z
        .string()
        .trim()
        .min(1)
        .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_KEY),
    scope_ids: z
        .array(scopeIdSchema)
        .min(1)
        .max(ACCESS_POLICY_FIELD_LIMITS.SCOPE_ID_LIST),
});

class CreateMembershipRequestDto extends createZodDto(CreateMembershipSchema) {}
class CreateMembershipsRequestDto extends createZodDto(
    CreateMembershipsSchema,
) {}

export { CreateMembershipRequestDto, CreateMembershipsRequestDto };
