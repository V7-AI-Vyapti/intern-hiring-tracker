import { Body, Controller, Param } from '@nestjs/common';
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
import { FILE_MANAGEMENT_FILE_META_DATA_UPDATE_RESPONSES } from '@file-management/file-management.constants';
import { FILE_META_DATA_MESSAGES } from '@file-management/file-meta-data.constants';
import { FileMetaDataResponseDto } from '@file-management/schema/file-meta.schema/response-file-meta-data.schema';
import { FileMetaDataUpdateDto } from '@file-management/schema/file-meta.schema/update-file-meta-data.schema';
import { FileIdParamsDto } from '@file-management/schema/file.schema/file-id-params.schema';
import { UpdateFileMetaDataService } from '@file-management/services/file-meta-data.services/update-file-meta-data.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FileMetaDataUpdateApi {
    constructor(private readonly service: UpdateFileMetaDataService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: FILE_MANAGEMENT_CONFIG.FILE_META_DATA_UPDATE_ROUTE,
        tags: FILE_MANAGEMENT_FILE_META_DATA_TAGS,
        responses: FILE_MANAGEMENT_FILE_META_DATA_UPDATE_RESPONSES,
    })
    async updateByFileId(
        @Param() params: FileIdParamsDto,
        @Body() payload: FileMetaDataUpdateDto,
    ): Promise<ApiSuccessResponse<FileMetaDataResponseDto>> {
        const data = await this.service.updateFileMetaDataByFileId(
            params.fileId,
            payload,
        );

        return apiSuccess(data, {
            message: FILE_META_DATA_MESSAGES.META_UPDATED,
        });
    }
}
