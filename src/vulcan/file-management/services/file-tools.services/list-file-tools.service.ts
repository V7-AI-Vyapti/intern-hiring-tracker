import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getEntityWithName } from '@vyapti/core';
import { DataSource, ILike } from 'typeorm';
import { FILE_MANAGEMENT_MESSAGES } from '../../file-management.constants';
import type { FileToolListResponseDto } from '../../schema/file-tool.schema/file-tool-list-response.schema';
import { FileToolsListQueryDto } from '../../schema/file-tool.schema/file-tools-list-query.schema';
import {
    buildFileToolListResponse,
    serializeFileToolList,
} from '../../serializers/list-file-tools.serializer';
import { readString } from '@vulcan/shared/utils/record-readers';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';

const RUNTIME_ENTITY_NAMES = {
    FILE: 'file',
    FILE_FILE_FORMAT_MAP: 'file_file_format_map',
    AVAILABLE_TOOL: 'available_tool',
} as const;

const SOURCE_FILE_FORMAT_NAME_KEY = 'source_file_format_name';

const FILE_TOOLS_LIST_SORT_COLUMNS = {
    configuredToolName: 'configured_tool_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
} as const;

@Injectable()
export class ListFileToolsService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async listFileTools(payload: {
        fileId: number;
        query: FileToolsListQueryDto;
    }): Promise<PaginatedListResult<FileToolListResponseDto>> {
        const fileModel = getEntityWithName(
            RUNTIME_ENTITY_NAMES.FILE,
            this.dataSource,
        );
        const file = await fileModel.getByPk(payload.fileId);

        if (!file) {
            throw new NotFoundException(
                FILE_MANAGEMENT_MESSAGES.FILE_NOT_FOUND,
            );
        }

        const pagination = resolvePagination(payload.query);
        const fileFormatNames = await this.fetchFileFormatNames(payload.fileId);

        if (fileFormatNames.size === 0) {
            return {
                items: buildFileToolListResponse([]),
                total: 0,
                pagination,
            };
        }

        const search = normalizeSearch(payload.query.search);
        const where = search
            ? { configured_tool_name: ILike(`%${search}%`) }
            : {};
        const order = buildAllowedOrder({
            columns: FILE_TOOLS_LIST_SORT_COLUMNS,
            sortBy: payload.query.sortBy,
            sortOrder: payload.query.sortOrder,
            defaultSortBy: 'configuredToolName',
            defaultSortOrder: 'ASC',
        });

        const availableToolModel = getEntityWithName(
            RUNTIME_ENTITY_NAMES.AVAILABLE_TOOL,
            this.dataSource,
        );
        const availableTools = await availableToolModel.filter(where, {
            order,
        });

        const matchingTools = availableTools.filter((tool) => {
            const sourceFileFormatName = this.readSourceFileFormatName(tool);
            return (
                sourceFileFormatName != null &&
                fileFormatNames.has(sourceFileFormatName)
            );
        });

        const pageRows = matchingTools.slice(
            pagination.skip,
            pagination.skip + pagination.take,
        );

        return {
            items: buildFileToolListResponse(serializeFileToolList(pageRows)),
            total: matchingTools.length,
            pagination,
        };
    }

    private async fetchFileFormatNames(fileId: number): Promise<Set<string>> {
        const fileFileFormatMapModel = getEntityWithName(
            RUNTIME_ENTITY_NAMES.FILE_FILE_FORMAT_MAP,
            this.dataSource,
        );
        const fileFormatMaps = await fileFileFormatMapModel.selectRelated(
            { file_id: fileId },
            { file_format_id: true },
        );

        const fileFormatNames = new Set<string>();

        for (const fileFormatMap of fileFormatMaps) {
            const fileFormat = (
                fileFormatMap as unknown as Record<string, unknown>
            ).file_format_id;

            if (!fileFormat || typeof fileFormat !== 'object') {
                continue;
            }

            fileFormatNames.add(readString(fileFormat, 'file_format_name'));
        }

        return fileFormatNames;
    }

    private readSourceFileFormatName(tool: unknown): string | null {
        const additionalJsonData = (tool as Record<string, unknown>)
            .additional_json_data;

        if (
            !additionalJsonData ||
            typeof additionalJsonData !== 'object' ||
            Array.isArray(additionalJsonData)
        ) {
            return null;
        }

        const sourceFileFormatName = (
            additionalJsonData as Record<string, unknown>
        )[SOURCE_FILE_FORMAT_NAME_KEY];

        if (
            typeof sourceFileFormatName !== 'string' ||
            sourceFileFormatName.trim().length === 0
        ) {
            return null;
        }

        return sourceFileFormatName.trim();
    }
}
