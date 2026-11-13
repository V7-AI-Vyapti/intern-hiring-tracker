import { Injectable } from '@nestjs/common';
import { BackgroundQueueService } from '@core/queue/background-queue.service';
import { PROCESS_STATUS } from '@vulcan/shared/constants/process.constants';
import { ProcessPersistenceService } from '@vulcan/shared/services/process-persistence.service';
import {
    EXCEL_TO_CSV_TOOL_NAME,
    EXCEL_TO_CSV_TOOL_TYPE,
} from '@file-management/file-management.constants';
import { enqueueExcelToCsv } from '@file-management/bullmq/excel-to-csv.queue';
import type { ExcelToCsvEnqueueResponseDto } from '@file-management/schema/file-tool.schema/excel-to-csv-enqueue-response.schema';

@Injectable()
export class TriggerExcelToCsvService {
    constructor(
        private readonly processPersistence: ProcessPersistenceService,
        private readonly backgroundQueueService: BackgroundQueueService,
    ) {}

    async triggerExcelToCsv(
        fileId: number,
    ): Promise<ExcelToCsvEnqueueResponseDto> {
        const processEntityId =
            await this.processPersistence.createProcessEntity({
                process_name: `excel_to_csv_${String(fileId)}_${String(Date.now())}`,
                process_status_name: PROCESS_STATUS.QUEUED,
                tool_type_name: EXCEL_TO_CSV_TOOL_TYPE,
                tool_name: EXCEL_TO_CSV_TOOL_NAME,
                process_metadata: {
                    file_id: fileId,
                    triggered_at: new Date().toISOString(),
                },
                description: 'Excel to CSV conversion process',
            });

        return enqueueExcelToCsv(
            this.backgroundQueueService,
            fileId,
            processEntityId,
        );
    }
}
