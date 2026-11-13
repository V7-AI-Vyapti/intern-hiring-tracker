import { Injectable, NotFoundException } from '@nestjs/common';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { PreviewUrlResponseDto } from '@file-management/schema/file.schema/preview-url.response.schema';
import { readString } from '@vulcan/shared/utils/record-readers';

@Injectable()
export class PreviewUrlService {
    constructor() {}

    async createFilePreviewUrl(fileId: number): Promise<PreviewUrlResponseDto> {
        const file = await FileEntity.getByPk(fileId);
        if (!file)
            throw new NotFoundException(`File not found: fileId=${fileId}`);
        const dto = new PreviewUrlResponseDto();
        dto.previewUrl = readString(file, 'file_url');
        return dto;
    }
}
