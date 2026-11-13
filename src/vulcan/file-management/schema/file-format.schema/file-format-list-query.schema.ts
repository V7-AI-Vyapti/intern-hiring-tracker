import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const FileFormatListSortBySchema = z.enum([
    'fileFormatId',
    'fileFormatName',
]);
export const FileFormatListSortOrderSchema = z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).default('ASC'),
);

export const FileFormatListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional().nullable(),
    sortBy: FileFormatListSortBySchema.default('fileFormatName'),
    sortOrder: FileFormatListSortOrderSchema,
});

export class FileFormatListQueryDto extends createZodDto(
    FileFormatListQuerySchema,
) {}
