import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
    FileMetaDataResponseDto,
    FileMetaDataResponseSchema,
} from './response-file-meta-data.schema';

export const FileMetaDataListResponseSchema = z.object({
    items: z.array(FileMetaDataResponseSchema),
});

export class FileMetaDataListResponseDto extends createZodDto(
    FileMetaDataListResponseSchema,
) {
    static from(items: FileMetaDataResponseDto[]): FileMetaDataListResponseDto {
        const parsed = FileMetaDataListResponseSchema.parse({ items });
        return Object.assign(new FileMetaDataListResponseDto(), parsed);
    }
}
