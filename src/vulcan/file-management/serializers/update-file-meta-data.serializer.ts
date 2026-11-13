import { FileMetaDataUpdateDto } from '@file-management/schema/file-meta.schema/update-file-meta-data.schema';

export function fileMetaDataUpdateToEntityPatch(
    dto: FileMetaDataUpdateDto,
): Record<string, unknown> {
    const patch: Record<string, unknown> = {};

    if (dto.name !== undefined) patch.file_meta_data_name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.mimeType !== undefined) patch.mime_type = dto.mimeType;
    if (dto.fileSizeBytes !== undefined) {
        patch.file_size_bytes = dto.fileSizeBytes;
    }
    if (dto.fileName !== undefined) patch.file_name = dto.fileName;
    if (dto.bucketName !== undefined) patch.bucket_name = dto.bucketName;
    if (dto.storagePath !== undefined) patch.storage_path = dto.storagePath;

    return patch;
}
