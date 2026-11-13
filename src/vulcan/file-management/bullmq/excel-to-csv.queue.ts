import { Logger, NotFoundException } from '@nestjs/common';
import type { Job } from 'bullmq';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FILE_MANAGEMENT_MESSAGES } from '@file-management/file-management.constants';
import type { ConvertExcelToCsvService } from '@file-management/services/file-tools.services/convert-excel-to-csv.service';
import { formatWorkerError } from '@file-management/utils/format-worker-error.util';
import type { BackgroundQueueService } from '@core/queue/background-queue.service';
import type { BackgroundWorkerRegistryService } from '@core/queue/background-worker-registry.service';
import type {
    BackgroundJobEnqueueResponse,
    BackgroundQueueDefinition,
} from '@core/queue/background-queue.types';

type ExcelToCsvJobData = {
    file_id: number;
    process_entity_id: number;
};

const EXCEL_TO_CSV_QUEUE = {
    configKey: 'excelToCsv',
    queueName: 'excel_to_csv',
    jobName: 'excel_to_csv',
} as const satisfies BackgroundQueueDefinition<ExcelToCsvJobData>;

async function enqueueExcelToCsv(
    backgroundQueueService: BackgroundQueueService,
    fileId: number,
    processEntityId: number,
): Promise<BackgroundJobEnqueueResponse> {
    const file = await FileEntity.getByPk(fileId);
    if (!file) {
        throw new NotFoundException(FILE_MANAGEMENT_MESSAGES.FILE_NOT_FOUND);
    }

    return backgroundQueueService.add(EXCEL_TO_CSV_QUEUE, {
        file_id: fileId,
        process_entity_id: processEntityId,
    });
}

function registerExcelToCsvWorker(
    workerRegistry: BackgroundWorkerRegistryService,
    convertExcelToCsvService: ConvertExcelToCsvService,
): void {
    const logger = new Logger('ExcelToCsvWorker');

    workerRegistry.register<ExcelToCsvJobData>(
        EXCEL_TO_CSV_QUEUE,
        async (job) => {
            await processExcelToCsvJob(job, convertExcelToCsvService, logger);
        },
    );
}

async function processExcelToCsvJob(
    job: Job<ExcelToCsvJobData>,
    convertExcelToCsvService: ConvertExcelToCsvService,
    logger: Logger,
): Promise<void> {
    const jobId = String(job.id);
    const { file_id: fileId, process_entity_id: processEntityId } = job.data;

    logger.log(
        `Excel to CSV conversion started (job_id=${jobId}, file_id=${String(fileId)}, process_entity_id=${String(processEntityId)})`,
    );

    try {
        const result = await convertExcelToCsvService.convertExcelToCsv({
            fileId,
            processEntityId,
        });
        logger.log(
            [
                `Excel to CSV conversion completed successfully (job_id=${jobId}, file_id=${String(fileId)}, process_entity_id=${String(processEntityId)})`,
                `sheets_exported=${String(result.sheets.length)}`,
            ].join(', '),
        );
    } catch (error: unknown) {
        const detail = formatWorkerError(error);
        logger.error(
            `Excel to CSV conversion failed (job_id=${jobId}, file_id=${String(fileId)}, process_entity_id=${String(processEntityId)}): ${detail}`,
            error instanceof Error ? error.stack : undefined,
        );
        throw error;
    }
}

export {
    EXCEL_TO_CSV_QUEUE,
    enqueueExcelToCsv,
    registerExcelToCsvWorker,
    type ExcelToCsvJobData,
};
