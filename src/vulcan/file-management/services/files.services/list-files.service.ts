import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileFolderMap as FileFolderMapEntity } from '@file-management/entities/file_folder_map.entity';
import { FileMetaData as FileMetaDataEntity } from '@file-management/entities/file_meta_data.entity';
import { FileListQueryDto } from '@file-management/schema/file.schema/file-list-query.schema';
import { FileListResponseDto } from '@file-management/schema/file.schema/file-list-response.schema';
import {
    buildFileListResponse,
    indexFolderIdsByFileId,
    indexMetaRowsByFileId,
    serializeFileList,
} from '@file-management/serializers/list-files.serializer';
import { readRelationId } from '@file-management/utils/relation-id';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';
import { readNumber } from '@vulcan/shared/utils/record-readers';

const FILE_LIST_SORT_COLUMNS = {
    fileId: 'file_id',
    fileName: 'file_name',
} as const;

@Injectable()
export class ListFilesService {
    constructor() {}

    async listFiles(
        filters: FileListQueryDto,
    ): Promise<PaginatedListResult<FileListResponseDto>> {
        const hasFolderFilter = filters.folderId != null;
        const pagination = resolvePagination(filters);
        const search = normalizeSearch(filters.search);
        const order = buildAllowedOrder({
            columns: FILE_LIST_SORT_COLUMNS,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            defaultSortBy: 'fileId',
            defaultSortOrder: 'DESC',
        });

        const listArgs = {
            filters,
            hasFolderFilter,
            search,
            order,
            pagination,
        };

        const [files, total] = await Promise.all([
            this.fetchFilesForList(listArgs),
            this.countFilesForList(listArgs),
        ]);

        if (files.length === 0) {
            return {
                items: buildFileListResponse([]),
                total,
                pagination,
            };
        }

        const fileIds = files.map((fileRecord) =>
            readNumber(fileRecord, 'file_id'),
        );

        const [fileFolderMaps, fileMetaRecords] = await Promise.all([
            FileFolderMapEntity.filter({ file_id: In(fileIds) }),
            FileMetaDataEntity.filter(
                { file_id: In(fileIds) },
                { relations: { file_id: true } },
            ),
        ]);

        const serializedItems = serializeFileList({
            files,
            folderByFileId: indexFolderIdsByFileId(fileFolderMaps),
            metaByFileId: indexMetaRowsByFileId(fileMetaRecords),
            folderFilterId: hasFolderFilter ? filters.folderId! : null,
        });

        return {
            items: buildFileListResponse(serializedItems),
            total,
            pagination,
        };
    }

    private async countFilesForList(args: {
        filters: FileListQueryDto;
        hasFolderFilter: boolean;
        search: string | null;
    }): Promise<number> {
        if (!args.hasFolderFilter) {
            return FileEntity.countOf(this.buildFileWhere(args.search));
        }

        const fileFolderMaps = await FileFolderMapEntity.filter({
            folder_id: args.filters.folderId,
        });

        const fileIdsInFolder = fileFolderMaps
            .map((mapRecord) => readRelationId(mapRecord.file_id, 'file_id'))
            .filter((id): id is number => id != null);

        if (fileIdsInFolder.length === 0) {
            return 0;
        }

        return FileEntity.countOf(
            this.buildFileWhere(args.search, fileIdsInFolder),
        );
    }

    private async fetchFilesForList(args: {
        filters: FileListQueryDto;
        hasFolderFilter: boolean;
        search: string | null;
        order: Record<string, 'ASC' | 'DESC'>;
        pagination: { skip: number; take: number };
    }): Promise<FileEntity[]> {
        if (!args.hasFolderFilter) {
            return FileEntity.filter(this.buildFileWhere(args.search), {
                order: args.order,
                skip: args.pagination.skip,
                take: args.pagination.take,
            });
        }

        const fileFolderMaps = await FileFolderMapEntity.filter({
            folder_id: args.filters.folderId,
        });

        const fileIdsInFolder = fileFolderMaps
            .map((mapRecord) => readRelationId(mapRecord.file_id, 'file_id'))
            .filter((id): id is number => id != null);

        if (fileIdsInFolder.length === 0) {
            return [];
        }

        return FileEntity.filter(
            this.buildFileWhere(args.search, fileIdsInFolder),
            {
                order: args.order,
                skip: args.pagination.skip,
                take: args.pagination.take,
            },
        );
    }

    private buildFileWhere(
        search: string | null,
        fileIds?: number[],
    ): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        if (fileIds) {
            where.file_id = In(fileIds);
        }

        if (search) {
            where.file_name = ILike(`%${search}%`);
        }

        return where;
    }
}
