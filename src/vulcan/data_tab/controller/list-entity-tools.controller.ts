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
import { EntityIdParamsDto } from '@data-tab/schema/entity-id-params.schema';
import { DataTabEntityToolsListQueryDto } from '@data-tab/schema/entity-tools-list-query.schema';
import { ListEntityToolsService } from '@data-tab/services/list-entity-tools.service';
import { FileToolListResponseDto } from '@file-management/schema/file-tool.schema/file-tool-list-response.schema';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListEntityToolsController {
    constructor(
        private readonly listEntityToolsService: ListEntityToolsService,
    ) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: DATA_TAB_CONFIG.LIST_ENTITY_TOOLS_ROUTE,
        tags: DATA_TAB_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: DATA_TAB_MESSAGES.ENTITY_TOOLS_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: DATA_TAB_MESSAGES.ENTITY_NOT_FOUND,
        },
    })
    async listEntityTools(
        @Param() params: EntityIdParamsDto,
        @Query() query: DataTabEntityToolsListQueryDto,
    ): Promise<ApiSuccessResponse<FileToolListResponseDto>> {
        const { items, total, pagination } =
            await this.listEntityToolsService.listEntityTools({
                entityId: params.entityId,
                query,
            });
        return apiSuccess(items, {
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
            message: DATA_TAB_MESSAGES.ENTITY_TOOLS_FETCHED,
        });
    }
}
