import { Injectable, NotFoundException } from '@nestjs/common';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileDownloadResponseDto } from '@file-management/schema/file.schema/file-download-response.schema';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';
import { FileStorageService } from '@file-management/services/file-storage.service';
import { readString } from '@vulcan/shared/utils/record-readers';

@Injectable()
export class DownloadFileService {
    constructor(
        private readonly storage: FileStorageService,
        private readonly fileMetaDataLookup: FileMetaDataLookupService,
    ) {}

    async createFileDownloadUrl(
        fileId: number,
    ): Promise<FileDownloadResponseDto> {
        const file = await FileEntity.getByPk(fileId);
        if (!file) {
            throw new NotFoundException(`File not found: fileId=${fileId}`);
        }

        const fileMeta = await this.fileMetaDataLookup.findByFileId(fileId);
        const storagePath = readString(fileMeta, 'storage_path');
        const bucketName = readString(fileMeta, 'bucket_name');

        const signed = await this.storage.createSignedDownload({
            storagePath,
            bucketName,
        });

        const dto = new FileDownloadResponseDto();
        dto.downloadUrl = signed.downloadUrl;
        return dto;
    }
}
