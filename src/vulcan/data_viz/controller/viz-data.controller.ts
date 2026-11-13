import { Controller, Param, Query } from '@nestjs/common';
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
import { VizDataQueryDto } from '../schema/viz-data-query.schema';
import { type VizDataResponse } from '../schema/viz-data-response.schema';
import { VizDataService } from '../services/viz-data.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class VizDataController {
    constructor(private readonly vizDataService: VizDataService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: DATA_VIZ_CONFIG.VIZ_DATA,
        tags: DATA_VIZ_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: DATA_VIZ_MESSAGES.VIZ_DATA_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: DATA_VIZ_MESSAGES.ENTITY_NOT_FOUND,
            [HTTP_STATUS_CODES.BAD_REQUEST]: 'Invalid visualization request',
        },
    })
    async getVizData(
        @Param() params: EntityIdParamsDto,
        @Query() query: VizDataQueryDto,
    ): Promise<ApiSuccessResponse<VizDataResponse>> {
        const data = await this.vizDataService.getVizData(
            params.entityId,
            query,
        );
        return apiSuccess(data, {
            message: DATA_VIZ_MESSAGES.VIZ_DATA_FETCHED,
        });
    }
}
