import { Controller, Param } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import {
    PROCESS_MANAGEMENT_CONFIG,
    PROCESS_MANAGEMENT_TAGS,
} from '@process-management/process-management.config';
import { PROCESS_MANAGEMENT_VIEW_PROCESS_DETAILS_RESPONSES } from '@process-management/process-management.constants';
import { ProcessDetailsDto } from '@process-management/schema/process-details.schema';
import { ProcessDetailsParamsDto } from '@process-management/schema/process-details-params.schema';
import { ViewProcessDetailsService } from '@process-management/services/view-process-details.service';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ViewProcessDetailsController {
    constructor(private readonly service: ViewProcessDetailsService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: PROCESS_MANAGEMENT_CONFIG.VIEW_PROCESS_DETAILS_ROUTE,
        tags: PROCESS_MANAGEMENT_TAGS,
        responses: PROCESS_MANAGEMENT_VIEW_PROCESS_DETAILS_RESPONSES,
    })
    async viewProcessDetails(
        @Param() params: ProcessDetailsParamsDto,
    ): Promise<ApiSuccessResponse<ProcessDetailsDto>> {
        const data = await this.service.viewProcessDetails(params.processId);
        return apiSuccess(data);
    }
}
