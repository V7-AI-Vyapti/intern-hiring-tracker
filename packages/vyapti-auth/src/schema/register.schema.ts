import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_PASSWORD } from '../auth.constants.js';

const RegisterRequestSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(AUTH_PASSWORD.MIN_LENGTH),
    display_name: z.string().trim().min(1).max(200).optional(),
});

class RegisterRequestDto extends createZodDto(RegisterRequestSchema) {}

type RegisterRequestInput = z.infer<typeof RegisterRequestSchema>;

export { RegisterRequestDto, RegisterRequestSchema };
export type { RegisterRequestInput };
