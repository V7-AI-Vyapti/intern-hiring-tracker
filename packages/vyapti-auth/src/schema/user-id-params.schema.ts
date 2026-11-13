import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UserIdParamsSchema = z.object({
    userId: z.string().trim().min(1),
});

class UserIdParamsDto extends createZodDto(UserIdParamsSchema) {}

export { UserIdParamsDto, UserIdParamsSchema };
