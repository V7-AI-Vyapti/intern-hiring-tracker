import { ListFileFormatsService } from '@file-management/services/file-formats.services/list-file-formats.service';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';
import { UpdateFileMetaDataService } from '@file-management/services/file-meta-data.services/update-file-meta-data.service';
import { DeleteFileService } from '@file-management/services/files.services/delete-file.service';
import { DownloadFileService } from '@file-management/services/files.services/download-file.service';
import { GetFileIdInfoService } from '@file-management/services/files.services/get-file-Id-info.service';
import { FileUploadService } from '@file-management/services/files.services/file-upload.service';
import { ConvertExcelToCsvService } from '@file-management/services/file-tools.services/convert-excel-to-csv.service';
import { ListFileToolsService } from '@file-management/services/file-tools.services/list-file-tools.service';
import { TriggerExcelToCsvService } from '@file-management/services/file-tools.services/trigger-excel-to-csv.service';
import { ProcessPersistenceService } from '@vulcan/shared/services/process-persistence.service';
import { ListFilesService } from '@file-management/services/files.services/list-files.service';
import { PreviewUrlService } from '@file-management/services/files.services/preview-url.service';
import { FileStorageService } from '@file-management/services/file-storage.service';

export const fileManagementProviders = [
    ListFileFormatsService,
    FileStorageService,
    FileMetaDataLookupService,
    DeleteFileService,
    DownloadFileService,
    PreviewUrlService,
    FileUploadService,
    ListFilesService,
    ListFileToolsService,
    ProcessPersistenceService,
    TriggerExcelToCsvService,
    ConvertExcelToCsvService,
    UpdateFileMetaDataService,
    GetFileIdInfoService,
];

/** @deprecated Prefer `fileManagementProviders`. */
export const services = fileManagementProviders;
