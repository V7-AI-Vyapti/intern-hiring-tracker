import { Injectable } from '@nestjs/common';
import { type HealthCheckResponse } from '../schema/health-check-response.schema';
import { serializeHealthCheck } from '../serializers/health-check.serializer';

@Injectable()
class HealthCheckService {
    getHealthCheck(): HealthCheckResponse {
        return serializeHealthCheck();
    }
}

export { HealthCheckService };
