import { Injectable } from '@nestjs/common';
import { FileMetaDataResponseDto } from '@file-management/schema/file-meta.schema/response-file-meta-data.schema';
import { FileMetaDataUpdateDto } from '@file-management/schema/file-meta.schema/update-file-meta-data.schema';
import { fileMetaDataUpdateToEntityPatch } from '@file-management/serializers/update-file-meta-data.serializer';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';

@Injectable()
export class UpdateFileMetaDataService {
    constructor(
        private readonly fileMetaDataLookup: FileMetaDataLookupService,
    ) {}

    async updateFileMetaDataByFileId(
        fileId: number,
        dto: FileMetaDataUpdateDto,
    ): Promise<FileMetaDataResponseDto> {
        const entity = await this.fileMetaDataLookup.findByFileId(fileId);
        const row = entity as unknown as Record<string, unknown>;
        const patch = fileMetaDataUpdateToEntityPatch(dto);
        Object.assign(row, patch);
        const saved = await entity.save();
        return FileMetaDataResponseDto.fromEntity(saved);
    }
}
