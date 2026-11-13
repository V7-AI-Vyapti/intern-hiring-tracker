import { FileFormat as FileFormatEntity } from '@file-management/entities/file_format.entity';
import { FileFormatListResponseDto } from '@file-management/schema/file-format.schema/file-format-list-response.schema';
import {
    FileFormatResponseDto,
    FileFormatResponseSchema,
} from '@file-management/schema/file-format.schema/file-format-response.schema';
import {
    readDescription,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';

export function serializeFileFormatListItem(
    fileFormat: FileFormatEntity,
): FileFormatResponseDto {
    const row = fileFormat as unknown as Record<string, unknown>;
    const parsed = FileFormatResponseSchema.parse({
        fileFormatId: readNumber(fileFormat, 'file_format_id'),
        fileFormatName: readString(fileFormat, 'file_format_name'),
        description: readDescription(row.description),
    });

    return Object.assign(new FileFormatResponseDto(), parsed);
}

export function serializeFileFormatList(
    fileFormats: FileFormatEntity[],
): FileFormatResponseDto[] {
    return fileFormats.map(serializeFileFormatListItem);
}

export function buildFileFormatListResponse(
    items: FileFormatResponseDto[],
): FileFormatListResponseDto {
    const response = new FileFormatListResponseDto();
    response.items = items;
    return response;
}
