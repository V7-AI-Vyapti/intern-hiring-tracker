import { Controller, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILE_FORMATS_TAGS,
} from '@file-management/file-management.config';
import { FILE_FORMAT_MESSAGES } from '@file-management/file-management.constants';
import { FileFormatListQueryDto } from '@file-management/schema/file-format.schema/file-format-list-query.schema';
import { FileFormatListResponseDto } from '@file-management/schema/file-format.schema/file-format-list-response.schema';
import { ListFileFormatsService } from '@file-management/services/file-formats.services/list-file-formats.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FileFormatsListApi {
    constructor(
        private readonly listFileFormatsService: ListFileFormatsService,
    ) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: FILE_MANAGEMENT_CONFIG.FILE_FORMATS_LIST_ROUTE,
        tags: FILE_MANAGEMENT_FILE_FORMATS_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: FILE_FORMAT_MESSAGES.FILE_FORMATS_FETCHED,
        },
    })
    async listFileFormats(
        @Query() query: FileFormatListQueryDto,
    ): Promise<ApiSuccessResponse<FileFormatListResponseDto>> {
        const data = await this.listFileFormatsService.listFileFormats(query);
        return apiSuccess(data, {
            message: FILE_FORMAT_MESSAGES.FILE_FORMATS_FETCHED,
        });
    }
}
