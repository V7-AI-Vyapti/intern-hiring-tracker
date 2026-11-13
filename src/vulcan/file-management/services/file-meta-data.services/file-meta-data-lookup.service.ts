import { Injectable, NotFoundException } from '@nestjs/common';
import { FileMetaData } from '@file-management/entities/file_meta_data.entity';

@Injectable()
export class FileMetaDataLookupService {
    async findByFileId(fileId: number): Promise<FileMetaData> {
        const [row] = await FileMetaData.filter(
            { file_id: fileId },
            { take: 1 },
        );
        if (!row) {
            throw new NotFoundException(
                `File metadata not found: fileId=${fileId}`,
            );
        }
        return row;
    }
}
