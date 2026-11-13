import { Injectable } from '@nestjs/common';
import { ILike } from 'typeorm';
import { FileFormat as FileFormatEntity } from '@file-management/entities/file_format.entity';
import { FileFormatListQueryDto } from '@file-management/schema/file-format.schema/file-format-list-query.schema';
import { FileFormatListResponseDto } from '@file-management/schema/file-format.schema/file-format-list-response.schema';
import {
    buildFileFormatListResponse,
    serializeFileFormatList,
} from '@file-management/serializers/list-file-formats.serializer';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
} from '@vulcan/shared/utils/list-query';

const FILE_FORMAT_LIST_SORT_COLUMNS = {
    fileFormatId: 'file_format_id',
    fileFormatName: 'file_format_name',
} as const;

@Injectable()
export class ListFileFormatsService {
    async listFileFormats(
        query: FileFormatListQueryDto,
    ): Promise<FileFormatListResponseDto> {
        const pagination = resolvePagination({
            page: query.page,
            limit: query.limit,
            defaultLimit: 20,
        });
        const search = normalizeSearch(query.search);
        const order = buildAllowedOrder({
            columns: FILE_FORMAT_LIST_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'fileFormatName',
            defaultSortOrder: 'ASC',
        });

        const where = search ? { file_format_name: ILike(`%${search}%`) } : {};

        const fileFormats = await FileFormatEntity.filter(where, {
            order,
            skip: pagination.skip,
            take: pagination.take,
        });

        return buildFileFormatListResponse(
            serializeFileFormatList(fileFormats),
        );
    }
}
