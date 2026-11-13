import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginRequestSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
});

class LoginRequestDto extends createZodDto(LoginRequestSchema) {}

type LoginRequestInput = z.infer<typeof LoginRequestSchema>;

export { LoginRequestDto, LoginRequestSchema };
export type { LoginRequestInput };
