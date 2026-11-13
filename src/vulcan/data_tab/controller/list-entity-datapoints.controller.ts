import { Controller, Param, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { DATA_TAB_CONFIG, DATA_TAB_TAGS } from '@data-tab/data-tab.config';
import { DATA_TAB_MESSAGES } from '@data-tab/data-tab.constants';
import { DataTabEntityDatapointsListQueryDto } from '@data-tab/schema/entity-datapoints-list-query.schema';
import { EntityIdParamsDto } from '@data-tab/schema/entity-id-params.schema';
import { ListEntityDatapointsService } from '@data-tab/services/list-entity-datapoints.service';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListEntityDatapointsController {
    constructor(private readonly service: ListEntityDatapointsService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: DATA_TAB_CONFIG.LIST_ENTITY_DATAPOINTS_ROUTE,
        tags: DATA_TAB_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: DATA_TAB_MESSAGES.ENTITY_DATAPOINTS_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: DATA_TAB_MESSAGES.ENTITY_NOT_FOUND,
        },
    })
    async listEntityDatapoints(
        @Param() params: EntityIdParamsDto,
        @Query() query: DataTabEntityDatapointsListQueryDto,
    ): Promise<ApiSuccessResponse<unknown[]>> {
        const { items, total, pagination } =
            await this.service.listEntityDatapoints({
                entityId: params.entityId,
                query,
            });
        return apiSuccess(items, {
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
            message: DATA_TAB_MESSAGES.ENTITY_DATAPOINTS_FETCHED,
        });
    }
}
