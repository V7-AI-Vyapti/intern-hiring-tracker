import { Controller, Param } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { EntityIdParamsDto } from '@data-tab/schema/entity-id-params.schema';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import { DATA_VIZ_CONFIG, DATA_VIZ_TAGS } from '../data-viz.config';
import { DATA_VIZ_MESSAGES } from '../data-viz.constants';
import { VizConfigResponseDto } from '../schema/viz-config-response.schema';
import { VizConfigService } from '../services/viz-config.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class VizConfigController {
    constructor(private readonly vizConfigService: VizConfigService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: DATA_VIZ_CONFIG.VIZ_CONFIG,
        tags: DATA_VIZ_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: DATA_VIZ_MESSAGES.VIZ_CONFIG_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: DATA_VIZ_MESSAGES.ENTITY_NOT_FOUND,
        },
    })
    async getVizConfig(
        @Param() params: EntityIdParamsDto,
    ): Promise<ApiSuccessResponse<VizConfigResponseDto>> {
        const data = await this.vizConfigService.getVizConfig(params.entityId);
        return apiSuccess(data, {
            message: DATA_VIZ_MESSAGES.VIZ_CONFIG_FETCHED,
        });
    }
}
