import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RoleIdParamsSchema = z.object({
    roleId: z.string().trim().min(1),
});

class RoleIdParamsDto extends createZodDto(RoleIdParamsSchema) {}

export { RoleIdParamsDto, RoleIdParamsSchema };
