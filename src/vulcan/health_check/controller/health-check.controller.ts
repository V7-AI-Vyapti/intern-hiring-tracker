import { Controller } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { Public } from '@vyapti/auth';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import { HEALTH_CHECK_CONFIG, HEALTH_CHECK_TAGS } from '../health-check.config';
import {
    HEALTH_CHECK_MESSAGES,
    HEALTH_CHECK_RESPONSES,
} from '../health-check.constants';
import { HealthCheckResponseDto } from '../schema/health-check-response.schema';
import { HealthCheckService } from '../services/health-check.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class HealthCheckController {
    constructor(private readonly healthCheckService: HealthCheckService) {}

    @Public()
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: HEALTH_CHECK_CONFIG.HEALTH_CHECK_ROUTE,
        tags: HEALTH_CHECK_TAGS,
        responses: HEALTH_CHECK_RESPONSES,
    })
    getHealthCheck(): ApiSuccessResponse<HealthCheckResponseDto> {
        const data = this.healthCheckService.getHealthCheck();
        return apiSuccess(data, {
            message: HEALTH_CHECK_MESSAGES.HEALTH_CHECK_OK,
        });
    }
}
