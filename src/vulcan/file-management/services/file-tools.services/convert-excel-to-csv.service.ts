import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileFolderMap as FileFolderMapEntity } from '@file-management/entities/file_folder_map.entity';
import { PROCESS_STATUS } from '@vulcan/shared/constants/process.constants';
import { ProcessPersistenceService } from '@vulcan/shared/services/process-persistence.service';
import { FILE_MANAGEMENT_MESSAGES } from '@file-management/file-management.constants';
import type { ExcelToCsvResponseDto } from '@file-management/schema/file-tool.schema/excel-to-csv-response.schema';
import { buildExcelToCsvResponse } from '@file-management/serializers/convert-excel-to-csv.serializer';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';
import { FileStorageService } from '@file-management/services/file-storage.service';
import { FileUploadService } from '@file-management/services/files.services/file-upload.service';
import { buildExcelCsvFileName } from '@file-management/utils/build-excel-csv-file-name';
import { convertExcelWorkbookBufferToCsvSheets } from '@file-management/utils/convert-excel-workbook-buffer-to-csv-sheets';
import { inferFileFormatName } from '@file-management/utils/infer-file-format-name';
import { readNumber, readString } from '@vulcan/shared/utils/record-readers';

const EXCEL_FILE_FORMAT_NAMES = new Set(['XLS', 'XLSX']);

@Injectable()
export class ConvertExcelToCsvService {
    constructor(
        @Inject(ProcessPersistenceService)
        private readonly processPersistence: ProcessPersistenceService,
        @Inject(FileStorageService)
        private readonly storage: FileStorageService,
        @Inject(FileMetaDataLookupService)
        private readonly fileMetaDataLookup: FileMetaDataLookupService,
        @Inject(FileUploadService)
        private readonly fileUploadService: FileUploadService,
    ) {}

    async convertExcelToCsv(args: {
        fileId: number;
        processEntityId: number;
    }): Promise<ExcelToCsvResponseDto> {
        await this.processPersistence.updateProcessStatus({
            process_id: args.processEntityId,
            status: PROCESS_STATUS.RUNNING,
        });

        try {
            const result = await this.runConversion(args.fileId);
            await this.processPersistence.updateProcessStatus({
                process_id: args.processEntityId,
                status: PROCESS_STATUS.SUCCESS,
                process_result_json: {
                    sourceFileId: result.sourceFileId,
                    sheets: result.sheets,
                },
            });
            return result;
        } catch (error: unknown) {
            await this.processPersistence.updateProcessStatus({
                process_id: args.processEntityId,
                status: PROCESS_STATUS.FAILED,
                process_error_json: {
                    message:
                        error instanceof Error ? error.message : String(error),
                },
            });
            throw error;
        }
    }

    private async runConversion(
        fileId: number,
    ): Promise<ExcelToCsvResponseDto> {
        const file = await FileEntity.getByPk(fileId);
        if (!file) {
            throw new NotFoundException(
                FILE_MANAGEMENT_MESSAGES.FILE_NOT_FOUND,
            );
        }

        const fileMeta = await this.fileMetaDataLookup.findByFileId(fileId);
        const fileName = readString(file, 'file_name');
        const mimeType = readString(fileMeta, 'mime_type');
        this.assertExcelFile({ fileName, mimeType });

        const excelBuffer = await this.storage.downloadObjectBuffer({
            storagePath: readString(fileMeta, 'storage_path'),
            bucketName: readString(fileMeta, 'bucket_name'),
        });

        const csvSheets = convertExcelWorkbookBufferToCsvSheets(excelBuffer);
        if (csvSheets.length === 0) {
            throw new BadRequestException(
                FILE_MANAGEMENT_MESSAGES.EXCEL_WORKBOOK_HAS_NO_SHEETS,
            );
        }

        const folderId = await this.resolveFolderIdForFile(fileId);
        const uploadedSheets: Array<{
            sheetName: string;
            csvFileName: string;
            fileId: number;
        }> = [];

        for (const sheet of csvSheets) {
            const csvFileName = buildExcelCsvFileName(
                fileName,
                sheet.sheetName,
            );
            const csvBuffer = Buffer.from(sheet.csvText, 'utf8');
            const uploadResponse = await this.fileUploadService.uploadFile(
                { folderId },
                {
                    buffer: csvBuffer,
                    originalname: csvFileName,
                    mimetype: 'text/csv',
                    size: csvBuffer.byteLength,
                },
            );

            uploadedSheets.push({
                sheetName: sheet.sheetName,
                csvFileName,
                fileId: uploadResponse.fileId,
            });
        }

        return buildExcelToCsvResponse({
            sourceFileId: fileId,
            sheets: uploadedSheets,
        });
    }

    private assertExcelFile(args: {
        fileName: string;
        mimeType: string;
    }): void {
        const inferredFormat = inferFileFormatName(args);
        if (
            inferredFormat == null ||
            !EXCEL_FILE_FORMAT_NAMES.has(inferredFormat)
        ) {
            throw new BadRequestException(
                FILE_MANAGEMENT_MESSAGES.EXCEL_FILE_REQUIRED,
            );
        }
    }

    private async resolveFolderIdForFile(
        fileId: number,
    ): Promise<number | undefined> {
        const [folderMap] = await FileFolderMapEntity.filter(
            { file_id: fileId },
            { take: 1 },
        );

        if (!folderMap) {
            return undefined;
        }

        return readNumber(folderMap, 'folder_id');
    }
}
