import { HEALTH_CHECK_STATUS } from '../health-check.constants';
import {
    HealthCheckResponseSchema,
    type HealthCheckResponse,
} from '../schema/health-check-response.schema';

function serializeHealthCheck(): HealthCheckResponse {
    return HealthCheckResponseSchema.parse({
        status: HEALTH_CHECK_STATUS.OK,
    });
}

export { serializeHealthCheck };
