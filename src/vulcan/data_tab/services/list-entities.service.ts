import { Injectable } from '@nestjs/common';
import { ILike } from 'typeorm';
import { Entity } from '@system-entities/entity.entity';
import { DataTabEntityListQueryDto } from '@data-tab/schema/entity-list-query.schema';
import { type DataTabEntityItem } from '@data-tab/schema/entity-list.schema';
import { serializeEntityRow } from '@data-tab/serializers/entity-list.serializer';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';

const DATA_TAB_ENTITY_LIST_SORT_COLUMNS = {
    entityName: 'entity_name',
} as const;

@Injectable()
export class ListEntitiesService {
    async listEntities(
        query: DataTabEntityListQueryDto,
    ): Promise<PaginatedListResult<DataTabEntityItem[]>> {
        const pagination = resolvePagination(query);
        const search = normalizeSearch(query.search);
        const where = search ? { entity_name: ILike(`%${search}%`) } : {};
        const order = buildAllowedOrder({
            columns: DATA_TAB_ENTITY_LIST_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'entityName',
        });

        const [rows, total] = await Promise.all([
            Entity.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            Entity.countOf(where),
        ]);

        return {
            items: rows.map(serializeEntityRow),
            total,
            pagination,
        };
    }
}
