import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RBAC_FIELD_LIMITS } from '../rbac.constants.js';

const CreateRoleSchema = z.object({
    name: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.NAME),
    label: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.LABEL).optional(),
    hint: z
        .string()
        .trim()
        .max(RBAC_FIELD_LIMITS.HINT)
        .optional()
        .nullable(),
});

const UpdateRoleSchema = z
    .object({
        name: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.NAME).optional(),
        label: z
            .string()
            .trim()
            .min(1)
            .max(RBAC_FIELD_LIMITS.LABEL)
            .optional(),
        hint: z
            .string()
            .trim()
            .max(RBAC_FIELD_LIMITS.HINT)
            .optional()
            .nullable(),
    })
    .refine(hasRoleUpdateField, {
        message: 'At least one role field is required',
    });

function hasRoleUpdateField(input: {
    name?: string;
    label?: string;
    hint?: string | null;
}): boolean {
    return (
        input.name !== undefined ||
        input.label !== undefined ||
        input.hint !== undefined
    );
}

class CreateRoleRequestDto extends createZodDto(CreateRoleSchema) {}
class UpdateRoleRequestDto extends createZodDto(UpdateRoleSchema) {}

export {
    CreateRoleRequestDto,
    CreateRoleSchema,
    UpdateRoleRequestDto,
    UpdateRoleSchema,
};
