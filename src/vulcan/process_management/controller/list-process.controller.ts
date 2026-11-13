import { Controller, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import {
    PROCESS_MANAGEMENT_CONFIG,
    PROCESS_MANAGEMENT_TAGS,
} from '@process-management/process-management.config';
import { PROCESS_MANAGEMENT_LIST_PROCESSES_RESPONSES } from '@process-management/process-management.constants';
import { ListProcessService } from '@process-management/services/list-process.service';
import { ProcessListQueryDto } from '@process-management/schema/process-list-query.schema';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListProcessController {
    constructor(private readonly service: ListProcessService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: PROCESS_MANAGEMENT_CONFIG.LIST_PROCESSES_ROUTE,
        tags: PROCESS_MANAGEMENT_TAGS,
        responses: PROCESS_MANAGEMENT_LIST_PROCESSES_RESPONSES,
    })
    async listProcesses(
        @Query() query: ProcessListQueryDto,
    ): Promise<ApiSuccessResponse<unknown[]>> {
        const { items, total, pagination } =
            await this.service.listProcesses(query);
        return apiSuccess(items, {
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
