import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ApiKeyIdParamsSchema = z.object({
    apiKeyId: z.string().trim().min(1),
});

class ApiKeyIdParamsDto extends createZodDto(ApiKeyIdParamsSchema) {}

export { ApiKeyIdParamsDto, ApiKeyIdParamsSchema };
