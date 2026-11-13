import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { BackgroundWorkerRegistryService } from '@core/queue/background-worker-registry.service';
import { registerExcelToCsvWorker } from '../bullmq/excel-to-csv.queue';
import { ConvertExcelToCsvService } from '../services/file-tools.services/convert-excel-to-csv.service';

@Injectable()
export class FileManagementWorkerRegistrar implements OnModuleInit {
    constructor(
        @Inject(BackgroundWorkerRegistryService)
        private readonly workerRegistry: BackgroundWorkerRegistryService,
        @Inject(ConvertExcelToCsvService)
        private readonly convertExcelToCsvService: ConvertExcelToCsvService,
    ) {}

    onModuleInit(): void {
        registerExcelToCsvWorker(
            this.workerRegistry,
            this.convertExcelToCsvService,
        );
    }
}
