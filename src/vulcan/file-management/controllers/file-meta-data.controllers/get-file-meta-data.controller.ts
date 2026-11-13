import { Controller, Param } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILE_META_DATA_TAGS,
} from '@file-management/file-management.config';
import { FILE_MANAGEMENT_FILE_META_DATA_GET_RESPONSES } from '@file-management/file-management.constants';
import { FILE_META_DATA_MESSAGES } from '@file-management/file-meta-data.constants';
import type { FileMetaDataResponseDto } from '@file-management/schema/file-meta.schema/response-file-meta-data.schema';
import { FileIdParamsDto } from '@file-management/schema/file.schema/file-id-params.schema';
import { GetFileIdInfoService } from '@file-management/services/files.services/get-file-Id-info.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FileMetaDataGetApi {
    constructor(private readonly service: GetFileIdInfoService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: FILE_MANAGEMENT_CONFIG.FILE_META_DATA_GET_ROUTE,
        tags: FILE_MANAGEMENT_FILE_META_DATA_TAGS,
        responses: FILE_MANAGEMENT_FILE_META_DATA_GET_RESPONSES,
    })
    async getByFileId(
        @Param() params: FileIdParamsDto,
    ): Promise<ApiSuccessResponse<FileMetaDataResponseDto>> {
        const data = await this.service.getFileMetaDataByFileId(params.fileId);
        return apiSuccess(data, {
            message: FILE_META_DATA_MESSAGES.META_FETCHED,
        });
    }
}
