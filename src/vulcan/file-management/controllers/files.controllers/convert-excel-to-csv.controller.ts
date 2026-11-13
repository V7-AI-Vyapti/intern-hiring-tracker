import { Body, Controller } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import {
    FILE_MANAGEMENT_CONFIG,
    FILE_MANAGEMENT_FILES_TAGS,
} from '../../file-management.config';
import { FILE_MANAGEMENT_MESSAGES } from '../../file-management.constants';
import { ExcelToCsvEnqueueResponseDto } from '../../schema/file-tool.schema/excel-to-csv-enqueue-response.schema';
import { TriggerExcelToCsvService } from '../../services/file-tools.services/trigger-excel-to-csv.service';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ExcelToCsvRequestSchema = z.object({
    file_id: z.coerce.number().int().min(1),
});

class ExcelToCsvRequestDto extends createZodDto(ExcelToCsvRequestSchema) {}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ConvertExcelToCsvApi {
    constructor(
        private readonly triggerExcelToCsvService: TriggerExcelToCsvService,
    ) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: FILE_MANAGEMENT_CONFIG.FILES_EXCEL_TO_CSV_ROUTE,
        tags: FILE_MANAGEMENT_FILES_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]:
                FILE_MANAGEMENT_MESSAGES.EXCEL_TO_CSV_TRIGGERED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                FILE_MANAGEMENT_MESSAGES.FILE_NOT_FOUND,
        },
    })
    async convertExcelToCsv(
        @Body() params: ExcelToCsvRequestDto,
    ): Promise<ApiSuccessResponse<ExcelToCsvEnqueueResponseDto>> {
        const data = await this.triggerExcelToCsvService.triggerExcelToCsv(
            params.file_id,
        );
        return apiSuccess(data, {
            message: FILE_MANAGEMENT_MESSAGES.EXCEL_TO_CSV_TRIGGERED,
        });
    }
}
