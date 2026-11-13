import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_MESSAGES } from '../auth.constants.js';

const UpdateUserRequestSchema = z
    .object({
        role_id: z.number().int().positive().nullable().optional(),
        is_active: z.boolean().optional(),
    })
    .refine(hasStaffUserChange, { message: AUTH_MESSAGES.USER_UPDATE_EMPTY });

class UpdateUserRequestDto extends createZodDto(UpdateUserRequestSchema) {}

function hasStaffUserChange(value: {
    role_id?: number | null;
    is_active?: boolean;
}): boolean {
    return value.role_id !== undefined || value.is_active !== undefined;
}

export { UpdateUserRequestDto, UpdateUserRequestSchema };
