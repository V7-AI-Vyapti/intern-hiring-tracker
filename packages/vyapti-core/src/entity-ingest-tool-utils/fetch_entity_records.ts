import type { DataSource } from 'typeorm';
import { entityRecordsToDictList } from './entity_records_to_dict_list.js';
import { getAllEntityRecords } from './get_all_entity_records.js';

const DEFAULT_FETCH_LIMIT = 100;
/** Queens PLUTO alone is ~325k lots; keep headroom for full lookup joins. */
const MAX_FETCH_LIMIT = 500_000;

function normalizeFetchLimit(limit: unknown): number {
    const numericLimit = Number(limit);
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
        return DEFAULT_FETCH_LIMIT;
    }

    return Math.min(Math.trunc(numericLimit), MAX_FETCH_LIMIT);
}

export async function fetch_entity_records(args: {
    entity_name: string;
    dataSource: DataSource;
    limit?: number;
}): Promise<Record<string, unknown>[]> {
    const entityName = args.entity_name?.trim();
    if (!entityName) {
        throw new Error('fetch_entity_records requires entity_name');
    }

    if (!args.dataSource) {
        throw new Error('fetch_entity_records requires dataSource');
    }

    const records = await getAllEntityRecords({
        entityName,
        dataSource: args.dataSource,
        limit: normalizeFetchLimit(args.limit),
    });

    return entityRecordsToDictList({ records });
}
