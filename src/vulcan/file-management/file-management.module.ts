import { Module } from '@nestjs/common';
import { BackgroundQueueModule } from '@core/queue/background-queue.module';
import { fileManagementControllers } from '@file-management/controllers/index';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';
import { ConvertExcelToCsvService } from '@file-management/services/file-tools.services/convert-excel-to-csv.service';
import { FileUploadService } from '@file-management/services/files.services/file-upload.service';
import { fileManagementProviders } from '@file-management/services/index';
import { FileStorageService } from '@file-management/services/file-storage.service';
import { ProcessPersistenceService } from '@vulcan/shared/services/process-persistence.service';

@Module({
    imports: [BackgroundQueueModule],
    controllers: [...fileManagementControllers],
    providers: [...fileManagementProviders],
    exports: [
        FileStorageService,
        FileMetaDataLookupService,
        ProcessPersistenceService,
        ConvertExcelToCsvService,
        FileUploadService,
    ],
})
export class FileManagementModule {}
