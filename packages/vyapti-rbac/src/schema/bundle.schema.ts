import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RBAC_FIELD_LIMITS } from '../rbac.constants.js';

const CreateBundleSchema = z.object({
    name: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.NAME),
    label: z.string().trim().min(1).max(RBAC_FIELD_LIMITS.LABEL).optional(),
    hint: z
        .string()
        .trim()
        .max(RBAC_FIELD_LIMITS.HINT)
        .optional()
        .nullable(),
});

const UpdateBundleSchema = z
    .object({
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
    .refine(hasBundleUpdateField, {
        message: 'At least one bundle field is required',
    });

function hasBundleUpdateField(input: {
    label?: string;
    hint?: string | null;
}): boolean {
    return input.label !== undefined || input.hint !== undefined;
}

class CreateBundleRequestDto extends createZodDto(CreateBundleSchema) {}
class UpdateBundleRequestDto extends createZodDto(UpdateBundleSchema) {}

export { CreateBundleRequestDto, UpdateBundleRequestDto };
