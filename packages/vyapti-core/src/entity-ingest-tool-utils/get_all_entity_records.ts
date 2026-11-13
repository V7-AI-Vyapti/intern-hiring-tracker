import type { DataSource } from 'typeorm';
import {
    CustomTypeormEntityBase,
    getEntityWithName,
} from '../custom_entities/custom_typeorm_entities.js';

export async function getAllEntityRecords(args: {
    entityName: string;
    dataSource: DataSource;
    limit?: number;
}): Promise<CustomTypeormEntityBase[]> {
    const entityModel = getEntityWithName(args.entityName, args.dataSource);

    return entityModel.filter(
        {},
        typeof args.limit === 'number' ? { take: args.limit } : {},
    );
}
