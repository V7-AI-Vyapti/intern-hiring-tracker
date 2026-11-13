import { Injectable } from '@nestjs/common';
import { FileMetaDataResponseDto } from '@file-management/schema/file-meta.schema/response-file-meta-data.schema';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';

@Injectable()
export class GetFileIdInfoService {
    constructor(
        private readonly fileMetaDataLookup: FileMetaDataLookupService,
    ) {}

    async getFileMetaDataByFileId(
        fileId: number,
    ): Promise<FileMetaDataResponseDto> {
        const metaRecord = await this.fileMetaDataLookup.findByFileId(fileId);
        return FileMetaDataResponseDto.fromEntity(metaRecord);
    }
}
