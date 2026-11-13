import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileListSortBySchema = z.enum(['fileId', 'fileName']);
export const FileListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('DESC'),
);

export const FileListQuerySchema = z.object({
    folderId: z.number().optional().nullable(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: FileListSortBySchema.default('fileId'),
    sortOrder: FileListSortOrderSchema,
});
export class FileListQueryDto extends createZodDto(FileListQuerySchema) {}
