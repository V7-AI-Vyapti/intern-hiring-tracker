import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { HEALTH_CHECK_STATUS } from '../health-check.constants';

const HealthCheckResponseSchema = z.object({
    status: z.literal(HEALTH_CHECK_STATUS.OK),
});

class HealthCheckResponseDto extends createZodDto(HealthCheckResponseSchema) {}

type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export {
    HealthCheckResponseDto,
    HealthCheckResponseSchema,
    type HealthCheckResponse,
};
