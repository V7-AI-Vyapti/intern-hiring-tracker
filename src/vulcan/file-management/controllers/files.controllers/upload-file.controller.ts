import { Body, Controller, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, MIME_TYPE } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILES_TAGS,
} from '@file-management/file-management.config';
import {
    FILE_MANAGEMENT_FILES_UPLOAD_RESPONSES,
    FILE_MANAGEMENT_MESSAGES,
    FILE_UPLOAD_SCHEMA_FOR_SWAGGER,
} from '@file-management/file-management.constants';
import type { FileUploadMultipartPayload } from '@file-management/schema/file.schema/file-upload-multipart.schema';
import { FileUploadRequestDto } from '@file-management/schema/file.schema/file-upload-request.schema';
import { FileUploadResponseDto } from '@file-management/schema/file.schema/file-upload-response.schema';
import { FileUploadService } from '@file-management/services/files.services/file-upload.service';

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class FilesUploadApi {
    constructor(private readonly service: FileUploadService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: FILE_MANAGEMENT_CONFIG.FILES_UPLOAD_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: FILE_MANAGEMENT_FILES_UPLOAD_RESPONSES,
        consumes: [MIME_TYPE.MULTIPART_FORM_DATA, MIME_TYPE.APPLICATION_JSON],
        body: { schema: FILE_UPLOAD_SCHEMA_FOR_SWAGGER },
        interceptors: [AnyFilesInterceptor()],
    })
    async uploadFiles(
        @Body() dto: FileUploadRequestDto,
        @UploadedFiles() files?: FileUploadMultipartPayload[],
    ): Promise<ApiSuccessResponse<FileUploadResponseDto[]>> {
        const data = await this.service.uploadFiles(dto, files);
        return apiSuccess(data, {
            message: FILE_MANAGEMENT_MESSAGES.FILE_UPLOADED,
        });
    }
}
