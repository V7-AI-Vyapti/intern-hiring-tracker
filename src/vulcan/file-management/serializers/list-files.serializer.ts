import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileFolderMap as FileFolderMapEntity } from '@file-management/entities/file_folder_map.entity';
import { FileMetaData as FileMetaDataEntity } from '@file-management/entities/file_meta_data.entity';
import { FileListResponseDto } from '@file-management/schema/file.schema/file-list-response.schema';
import {
    FileResponseDto,
    FileResponseSchema,
} from '@file-management/schema/file.schema/file-response.schema';
import { readRelationId } from '@file-management/utils/relation-id';
import {
    readDescription,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';

export function indexFolderIdsByFileId(
    fileFolderMaps: FileFolderMapEntity[],
): Map<number, number> {
    const folderByFileId = new Map<number, number>();

    for (const mapRecord of fileFolderMaps) {
        const mappedFileId = readRelationId(mapRecord.file_id, 'file_id');
        const mappedFolderId = readRelationId(mapRecord.folder_id, 'folder_id');
        if (
            mappedFileId != null &&
            mappedFolderId != null &&
            !folderByFileId.has(mappedFileId)
        ) {
            folderByFileId.set(mappedFileId, mappedFolderId);
        }
    }

    return folderByFileId;
}

export function indexMetaRowsByFileId(
    fileMetaRecords: FileMetaDataEntity[],
): Map<number, Record<string, unknown>> {
    const metaByFileId = new Map<number, Record<string, unknown>>();

    for (const fileMetaRecord of fileMetaRecords) {
        const row = fileMetaRecord as unknown as Record<string, unknown>;
        const metaFileId = readRelationId(row.file_id, 'file_id');
        if (metaFileId == null) continue;
        if (!metaByFileId.has(metaFileId)) {
            metaByFileId.set(metaFileId, row);
        }
    }

    return metaByFileId;
}

export function serializeFileListItem(args: {
    file: FileEntity;
    meta?: Record<string, unknown>;
    folderId: number | null;
}): FileResponseDto {
    const fileRecord = args.file as unknown as Record<string, unknown>;
    const meta = args.meta;

    const parsed = FileResponseSchema.parse({
        fileId: readNumber(args.file, 'file_id'),
        fileName: readString(args.file, 'file_name'),
        description: readDescription(fileRecord.description) ?? '',
        fileUrl: readString(args.file, 'file_url'),
        folderId: args.folderId,
        fileMetaDataId: meta ? readNumber(meta, 'file_meta_data_id') : null,
        fileMetaDataName: meta ? readString(meta, 'file_meta_data_name') : null,
        mimeType: meta ? readString(meta, 'mime_type') : null,
        fileSizeBytes: meta ? readNumber(meta, 'file_size_bytes') : null,
        bucketName: meta ? readString(meta, 'bucket_name') : null,
        storagePath: meta ? readString(meta, 'storage_path') : null,
        metaCreatedAt: meta ? readNumber(meta, 'created_at') : null,
        metaUpdatedAt: meta ? readNumber(meta, 'updated_at') : null,
    });

    return Object.assign(new FileResponseDto(), parsed);
}

export function serializeFileList(args: {
    files: FileEntity[];
    folderByFileId: Map<number, number>;
    metaByFileId: Map<number, Record<string, unknown>>;
    folderFilterId: number | null;
}): FileResponseDto[] {
    return args.files.map((fileRecord) => {
        const fileId = readNumber(fileRecord, 'file_id');
        const folderId =
            args.folderByFileId.get(fileId) ?? args.folderFilterId ?? null;

        return serializeFileListItem({
            file: fileRecord,
            meta: args.metaByFileId.get(fileId),
            folderId,
        });
    });
}

export function buildFileListResponse(
    items: FileResponseDto[],
): FileListResponseDto {
    const response = new FileListResponseDto();
    response.items = items;
    return response;
}
