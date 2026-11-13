import { z } from 'zod';

const UserCreateSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password_hash: z.string().min(1),
    display_name: z.string().trim().min(1).max(200).nullable(),
    is_active: z.boolean(),
    role_id: z.number().int().positive().nullable().optional(),
});

const UserUpdateSchema = z
    .object({
        email: z.string().trim().email().toLowerCase().optional(),
        display_name: z.string().trim().min(1).max(200).nullable().optional(),
        role_id: z.number().int().positive().nullable().optional(),
        is_active: z.boolean().optional(),
        password_hash: z.string().min(1).optional(),
        password_reset_token_hash: z.string().length(64).nullable().optional(),
        password_reset_expires_at: z
            .string()
            .min(1)
            .max(64)
            .nullable()
            .optional(),
    })
    .refine(hasUserUpdateField, { message: 'At least one field is required' });

function hasUserUpdateField(value: object): boolean {
    return Object.values(value).some(function isSet(field) {
        return field !== undefined;
    });
}

type UserCreateInput = z.infer<typeof UserCreateSchema>;
type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

export { UserCreateSchema, UserUpdateSchema };
export type { UserCreateInput, UserUpdateInput };
