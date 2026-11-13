import { Controller, Param, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILES_TAGS,
} from '../../file-management.config';
import { FILE_MANAGEMENT_MESSAGES } from '../../file-management.constants';
import { FileIdParamsDto } from '../../schema/file.schema/file-id-params.schema';
import { FileToolListResponseDto } from '../../schema/file-tool.schema/file-tool-list-response.schema';
import { FileToolsListQueryDto } from '../../schema/file-tool.schema/file-tools-list-query.schema';
import { ListFileToolsService } from '../../services/file-tools.services/list-file-tools.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListFileToolsApi {
    constructor(private readonly listFileToolsService: ListFileToolsService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: FILE_MANAGEMENT_CONFIG.FILES_TOOLS_LIST_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FILE_TOOLS_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                FILE_MANAGEMENT_MESSAGES.FILE_NOT_FOUND,
        },
    })
    async listFileTools(
        @Param() params: FileIdParamsDto,
        @Query() query: FileToolsListQueryDto,
    ): Promise<ApiSuccessResponse<FileToolListResponseDto>> {
        const { items, total, pagination } =
            await this.listFileToolsService.listFileTools({
                fileId: params.fileId,
                query,
            });
        return apiSuccess(items, {
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
            message: FILE_MANAGEMENT_MESSAGES.FILE_TOOLS_FETCHED,
        });
    }
}
