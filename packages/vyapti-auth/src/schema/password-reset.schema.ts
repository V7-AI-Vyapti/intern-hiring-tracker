import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_PASSWORD } from '../auth.constants.js';

const PasswordResetRequestSchema = z.object({
    token: z.string().trim().min(1),
    password: z.string().min(AUTH_PASSWORD.MIN_LENGTH),
});

class PasswordResetRequestDto extends createZodDto(
    PasswordResetRequestSchema,
) {}

export { PasswordResetRequestDto, PasswordResetRequestSchema };
