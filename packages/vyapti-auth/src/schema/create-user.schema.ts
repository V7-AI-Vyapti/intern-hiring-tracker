import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_PASSWORD } from '../auth.constants.js';

const CreateUserRequestSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    display_name: z.string().trim().min(1).max(200).optional(),
    role_id: z.number().int().positive(),
    password: z.string().min(AUTH_PASSWORD.MIN_LENGTH).optional(),
    otp: z.boolean().optional(),
});

class CreateUserRequestDto extends createZodDto(CreateUserRequestSchema) {}

export { CreateUserRequestDto, CreateUserRequestSchema };
