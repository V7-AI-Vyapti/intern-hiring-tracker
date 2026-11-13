import { FileFormatsListApi } from '@file-management/controllers/file-formats.controllers/list-file-formats.controller';
import { FileMetaDataGetApi } from '@file-management/controllers/file-meta-data.controllers/get-file-meta-data.controller';
import { FileMetaDataUpdateApi } from '@file-management/controllers/file-meta-data.controllers/update-file-meta-data.controller';
import { ConvertExcelToCsvApi } from '@file-management/controllers/files.controllers/convert-excel-to-csv.controller';
import { FilesDeleteApi } from '@file-management/controllers/files.controllers/delete-file.controller';
import { FilesDownloadUrlApi } from '@file-management/controllers/files.controllers/download-url.controller';
import { FilesListApi } from '@file-management/controllers/files.controllers/list-files.controller';
import { ListFileToolsApi } from '@file-management/controllers/files.controllers/list-file-tools.controller';
import { FilesPreviewUrlApi } from '@file-management/controllers/files.controllers/preview-url.controller';
import { FilesUploadApi } from '@file-management/controllers/files.controllers/upload-file.controller';

export const fileManagementControllers = [
    FileFormatsListApi,
    FilesUploadApi,
    FilesDownloadUrlApi,
    FilesPreviewUrlApi,
    FilesListApi,
    ListFileToolsApi,
    ConvertExcelToCsvApi,
    FilesDeleteApi,
    FileMetaDataGetApi,
    FileMetaDataUpdateApi,
];

/** @deprecated Prefer `fileManagementControllers`. */
export const controller = fileManagementControllers;
