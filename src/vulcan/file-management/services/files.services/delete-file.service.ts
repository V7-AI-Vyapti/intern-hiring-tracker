import { Injectable, NotFoundException } from '@nestjs/common';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileFileFormatMap as FileFileFormatMapEntity } from '@file-management/entities/file_file_format_map.entity';
import { FileFolderMap as FileFolderMapEntity } from '@file-management/entities/file_folder_map.entity';
import { FileMetaData } from '@file-management/entities/file_meta_data.entity';
import { FileMetaDataLookupService } from '@file-management/services/file-meta-data.services/file-meta-data-lookup.service';
import { FileStorageService } from '@file-management/services/file-storage.service';
import { readString } from '@vulcan/shared/utils/record-readers';

type DeleteFileAndMetaPayload = {
    fileId: number;
};

@Injectable()
export class DeleteFileService {
    constructor(
        private readonly storage: FileStorageService,
        private readonly fileMetaDataLookup: FileMetaDataLookupService,
    ) {}

    async deleteFileAndMeta(payload: DeleteFileAndMetaPayload) {
        const file = await FileEntity.getByPk(payload.fileId);
        if (!file) {
            throw new NotFoundException(
                `File not found: fileId=${payload.fileId}`,
            );
        }

        const fileMeta = await this.findFileMetaOrNull(payload.fileId);

        await FileFileFormatMapEntity.deleteWhere({
            file_id: payload.fileId,
        });
        await FileFolderMapEntity.deleteWhere({ file_id: payload.fileId });
        await FileMetaData.deleteWhere({ file_id: payload.fileId });
        await FileEntity.deleteByPk(payload.fileId);

        return { file, meta: fileMeta };
    }

    async deleteFileById(
        fileId: number,
    ): Promise<{ deleted: true; fileId: number }> {
        const { meta } = await this.deleteFileAndMeta({ fileId });

        if (meta) {
            await this.storage.deleteObjectIfPresent({
                storagePath: readString(meta, 'storage_path'),
                bucketName: readString(meta, 'bucket_name'),
            });
        }

        return { deleted: true, fileId };
    }

    private async findFileMetaOrNull(fileId: number) {
        try {
            return await this.fileMetaDataLookup.findByFileId(fileId);
        } catch {
            return null;
        }
    }
}
