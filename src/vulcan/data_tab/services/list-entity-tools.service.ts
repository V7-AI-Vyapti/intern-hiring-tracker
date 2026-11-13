import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getEntityWithName } from '@vyapti/core';
import { DataSource, ILike } from 'typeorm';
import { DATA_TAB_MESSAGES } from '@data-tab/data-tab.constants';
import { DataTabEntityToolsListQueryDto } from '@data-tab/schema/entity-tools-list-query.schema';
import type { FileToolListResponseDto } from '@file-management/schema/file-tool.schema/file-tool-list-response.schema';
import {
    buildFileToolListResponse,
    serializeFileToolList,
} from '@file-management/serializers/list-file-tools.serializer';
import { readString } from '@vulcan/shared/utils/record-readers';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';

const RUNTIME_ENTITY_NAMES = {
    ENTITY: 'entity',
    AVAILABLE_TOOL: 'available_tool',
} as const;

const SOURCE_ENTITY_NAME_KEY = 'source_entity_name';

const DATA_TAB_ENTITY_TOOLS_LIST_SORT_COLUMNS = {
    configuredToolName: 'configured_tool_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
} as const;

@Injectable()
export class ListEntityToolsService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async listEntityTools(payload: {
        entityId: number;
        query: DataTabEntityToolsListQueryDto;
    }): Promise<PaginatedListResult<FileToolListResponseDto>> {
        const entityModel = getEntityWithName(
            RUNTIME_ENTITY_NAMES.ENTITY,
            this.dataSource,
        );
        const entity = await entityModel.getByPk(payload.entityId);

        if (!entity) {
            throw new NotFoundException(DATA_TAB_MESSAGES.ENTITY_NOT_FOUND);
        }

        const entityName = readString(entity, 'entity_name');
        const pagination = resolvePagination(payload.query);
        const search = normalizeSearch(payload.query.search);
        const where = search
            ? { configured_tool_name: ILike(`%${search}%`) }
            : {};
        const order = buildAllowedOrder({
            columns: DATA_TAB_ENTITY_TOOLS_LIST_SORT_COLUMNS,
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
            const sourceEntityName = this.readSourceEntityName(tool);
            return sourceEntityName != null && sourceEntityName === entityName;
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

    private readSourceEntityName(tool: unknown): string | null {
        const additionalJsonData = (tool as Record<string, unknown>)
            .additional_json_data;

        if (
            !additionalJsonData ||
            typeof additionalJsonData !== 'object' ||
            Array.isArray(additionalJsonData)
        ) {
            return null;
        }

        const sourceEntityName = (
            additionalJsonData as Record<string, unknown>
        )[SOURCE_ENTITY_NAME_KEY];

        if (
            typeof sourceEntityName !== 'string' ||
            sourceEntityName.trim().length === 0
        ) {
            return null;
        }

        return sourceEntityName.trim();
    }
}
