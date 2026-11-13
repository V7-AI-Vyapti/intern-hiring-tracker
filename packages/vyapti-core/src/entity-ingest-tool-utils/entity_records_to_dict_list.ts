import type { CustomTypeormEntityBase } from '../custom_entities/custom_typeorm_entities.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function serializeEntityRecord(
    record: CustomTypeormEntityBase,
): Record<string, unknown> {
    const plain: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
        if (value instanceof Date) {
            plain[key] = value.toISOString();
            continue;
        }

        if (isPlainObject(value) && 'id' in value) {
            plain[key] = value.id;
            continue;
        }

        plain[key] = value;
    }

    return plain;
}

export function entityRecordsToDictList(args: {
    records: CustomTypeormEntityBase[];
}): Record<string, unknown>[] {
    return args.records.map(serializeEntityRecord);
}
