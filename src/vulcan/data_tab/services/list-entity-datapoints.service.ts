import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getEntityWithName } from '@vyapti/core';
import {
    DataSource,
    ILike,
    type EntityTarget,
    type FindOptionsWhere,
    type ObjectLiteral,
} from 'typeorm';
import { Entity } from '@system-entities/entity.entity';
import { DATA_TAB_MESSAGES } from '@data-tab/data-tab.constants';
import { DataTabEntityDatapointsListQueryDto } from '@data-tab/schema/entity-datapoints-list-query.schema';
import { readString } from '@vulcan/shared/utils/record-readers';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';

const DATA_TAB_DATAPOINT_LIST_SORT_COLUMNS = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
} as const;

@Injectable()
export class ListEntityDatapointsService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async listEntityDatapoints(payload: {
        entityId: number;
        query: DataTabEntityDatapointsListQueryDto;
    }): Promise<PaginatedListResult<unknown[]>> {
        const entity = await Entity.getByPk(payload.entityId);

        if (!entity) {
            throw new NotFoundException(DATA_TAB_MESSAGES.ENTITY_NOT_FOUND);
        }

        const entityName = readString(entity, 'entity_name');
        const entityModel = getEntityWithName(entityName, this.dataSource);
        const pagination = resolvePagination(payload.query);
        const search = normalizeSearch(payload.query.search);
        const where = this.buildSearchWhere({
            entityModel,
            search,
        });
        const order = this.resolveOrderWithExistingColumn({
            entityModel,
            order: buildAllowedOrder({
                columns: DATA_TAB_DATAPOINT_LIST_SORT_COLUMNS,
                sortBy: payload.query.sortBy,
                sortOrder: payload.query.sortOrder,
                defaultSortBy: 'createdAt',
                defaultSortOrder: 'DESC',
            }),
        });

        const [items, total] = await Promise.all([
            entityModel.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            entityModel.countOf(where),
        ]);

        return {
            items,
            total,
            pagination,
        };
    }

    private resolveOrderWithExistingColumn(args: {
        entityModel: EntityTarget<ObjectLiteral>;
        order: Record<string, 'ASC' | 'DESC'>;
    }): Record<string, 'ASC' | 'DESC'> {
        const sortColumn = Object.keys(args.order)[0];
        if (!sortColumn) {
            return {};
        }

        const metadata = this.dataSource.getMetadata(args.entityModel);
        let columnExists = false;
        for (const column of metadata.columns) {
            if (column.propertyName === sortColumn) {
                columnExists = true;
                break;
            }
        }

        if (columnExists) {
            return args.order;
        }

        const primaryKey = metadata.primaryColumns[0]?.propertyName;
        if (!primaryKey) {
            return {};
        }

        return { [primaryKey]: args.order[sortColumn] };
    }

    private buildSearchWhere(args: {
        entityModel: EntityTarget<ObjectLiteral>;
        search: string | null;
    }): FindOptionsWhere<ObjectLiteral> | FindOptionsWhere<ObjectLiteral>[] {
        if (!args.search) {
            return {};
        }

        const searchableColumns = this.resolveSearchableStringColumns(
            args.entityModel,
        );
        if (searchableColumns.length === 0) {
            return {};
        }

        const pattern = `%${args.search}%`;
        return searchableColumns.map((column) => ({
            [column]: ILike(pattern),
        }));
    }

    private resolveSearchableStringColumns(
        entityModel: EntityTarget<ObjectLiteral>,
    ): string[] {
        try {
            const metadata = this.dataSource.getMetadata(entityModel);
            const searchableColumns: string[] = [];

            for (const column of metadata.columns) {
                if (!isSearchableStringColumnType(column.type)) {
                    continue;
                }

                searchableColumns.push(column.propertyName);
            }

            return searchableColumns;
        } catch {
            return [];
        }
    }
}

const SEARCHABLE_STRING_COLUMN_TYPES = new Set([
    'varchar',
    'character varying',
    'character',
    'char',
    'text',
    'citext',
    'nvarchar',
    'nchar',
    'string',
]);

function isSearchableStringColumnType(columnType: unknown): boolean {
    if (columnType === String) {
        return true;
    }

    if (typeof columnType !== 'string') {
        return false;
    }

    return SEARCHABLE_STRING_COLUMN_TYPES.has(columnType.toLowerCase());
}
