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
    FILE_MANAGEMENT_FILES_PREVIEW_URL_RESPONSES,
    FILE_MANAGEMENT_MESSAGES,
} from '@file-management/file-management.constants';
import { PreviewUrlResponseDto } from '@file-management/schema/file.schema/preview-url.response.schema';
import { FileIdParamsDto } from '@file-management/schema/file.schema/file-id-params.schema';
import { PreviewUrlService } from '@file-management/services/files.services/preview-url.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FilesPreviewUrlApi {
    constructor(private readonly service: PreviewUrlService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: FILE_MANAGEMENT_CONFIG.FILES_PREVIEW_URL_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: FILE_MANAGEMENT_FILES_PREVIEW_URL_RESPONSES,
    })
    async createFilePreviewUrlById(
        @Param() params: FileIdParamsDto,
    ): Promise<ApiSuccessResponse<PreviewUrlResponseDto>> {
        const data = await this.service.createFilePreviewUrl(params.fileId);
        return apiSuccess(data, {
            message: FILE_MANAGEMENT_MESSAGES.PREVIEW_URL_CREATED,
        });
    }
}
