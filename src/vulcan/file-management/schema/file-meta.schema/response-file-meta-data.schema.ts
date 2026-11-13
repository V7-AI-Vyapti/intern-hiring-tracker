import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FileMetaDataResponseSchema = z.object({
    fileMetaDataId: z.number().int(),
    name: z.string(),
    description: z.string(),
    mimeType: z.string(),
    fileSizeBytes: z.number().int(),
    fileName: z.string(),
    bucketName: z.string(),
    storagePath: z.string(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
    fileId: z.number().int(),
    folderId: z.number().int().nullable(),
});

export type FileMetaDataResponse = z.infer<typeof FileMetaDataResponseSchema>;

type Relation<K extends string> =
    | number
    | null
    | undefined
    | (Record<string, unknown> & Partial<Record<K, number>>);

function readRelationId<K extends string>(
    value: Relation<K>,
    key: K,
): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && key in value) {
        const id = (value as Record<K, unknown>)[key];
        return typeof id === 'number' ? id : null;
    }
    return null;
}

export class FileMetaDataResponseDto extends createZodDto(
    FileMetaDataResponseSchema,
) {
    static fromEntity(entity: object): FileMetaDataResponseDto {
        const row = entity as Record<string, unknown>;
        const fileId = readRelationId(
            row.file_id as Relation<'file_id'>,
            'file_id',
        );
        if (fileId === null) {
            throw new Error('file_meta_data row is missing file_id');
        }

        const parsed = FileMetaDataResponseSchema.parse({
            fileMetaDataId: row.file_meta_data_id,
            name: row.file_meta_data_name,
            description: (row.description as string | null) ?? '',
            mimeType: row.mime_type,
            fileSizeBytes: row.file_size_bytes,
            fileName: row.file_name,
            bucketName: row.bucket_name,
            storagePath: row.storage_path,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            fileId,
            folderId: readRelationId(
                row.folder_id as Relation<'folder_id'>,
                'folder_id',
            ),
        });

        return Object.assign(new FileMetaDataResponseDto(), parsed);
    }
}
