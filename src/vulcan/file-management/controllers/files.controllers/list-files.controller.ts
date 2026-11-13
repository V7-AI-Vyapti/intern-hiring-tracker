import { Controller, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILES_TAGS,
} from '@file-management/file-management.config';
import {
    FILE_MANAGEMENT_FILES_LIST_RESPONSES,
    FILE_MANAGEMENT_MESSAGES,
} from '@file-management/file-management.constants';
import { FileListQueryDto } from '@file-management/schema/file.schema/file-list-query.schema';
import { FileListResponseDto } from '@file-management/schema/file.schema/file-list-response.schema';
import { ListFilesService } from '@file-management/services/files.services/list-files.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FilesListApi {
    constructor(private readonly listFilesService: ListFilesService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: FILE_MANAGEMENT_CONFIG.FILES_LIST_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: FILE_MANAGEMENT_FILES_LIST_RESPONSES,
    })
    async listFiles(
        @Query() query: FileListQueryDto,
    ): Promise<ApiSuccessResponse<FileListResponseDto>> {
        const { items, total, pagination } =
            await this.listFilesService.listFiles(query);
        return apiSuccess(items, {
            message: FILE_MANAGEMENT_MESSAGES.FILES_FETCHED,
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
