import { Controller, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import { DATA_TAB_CONFIG, DATA_TAB_TAGS } from '@data-tab/data-tab.config';
import { DATA_TAB_LIST_ENTITIES_RESPONSES } from '@data-tab/data-tab.constants';
import { DataTabEntityListQueryDto } from '@data-tab/schema/entity-list-query.schema';
import { DataTabEntityItemDto } from '@data-tab/schema/entity-list.schema';
import { ListEntitiesService } from '@data-tab/services/list-entities.service';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListEntityController {
    constructor(private readonly service: ListEntitiesService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: DATA_TAB_CONFIG.LIST_ENTITIES_ROUTE,
        tags: DATA_TAB_TAGS,
        responses: DATA_TAB_LIST_ENTITIES_RESPONSES,
    })
    async listEntities(
        @Query() query: DataTabEntityListQueryDto,
    ): Promise<ApiSuccessResponse<DataTabEntityItemDto[]>> {
        const { items, total, pagination } =
            await this.service.listEntities(query);
        return apiSuccess(items, {
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
