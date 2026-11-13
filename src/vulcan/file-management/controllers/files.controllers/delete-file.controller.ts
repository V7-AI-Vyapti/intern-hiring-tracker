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
    FILE_MANAGEMENT_FILES_TAGS,
} from '@file-management/file-management.config';
import {
    FILE_MANAGEMENT_FILES_DELETE_RESPONSES,
    FILE_MANAGEMENT_MESSAGES,
} from '@file-management/file-management.constants';
import { FileDeleteResponseDto } from '@file-management/schema/file.schema/file-delete-response.schema';
import { FileIdParamsDto } from '@file-management/schema/file.schema/file-id-params.schema';
import { DeleteFileService } from '@file-management/services/files.services/delete-file.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FilesDeleteApi {
    constructor(private readonly service: DeleteFileService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: FILE_MANAGEMENT_CONFIG.FILES_DELETE_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: FILE_MANAGEMENT_FILES_DELETE_RESPONSES,
    })
    async deleteFileById(
        @Param() params: FileIdParamsDto,
    ): Promise<ApiSuccessResponse<FileDeleteResponseDto>> {
        const data = await this.service.deleteFileById(params.fileId);
        return apiSuccess(data, {
            message: FILE_MANAGEMENT_MESSAGES.FILE_DELETED,
        });
    }
}
