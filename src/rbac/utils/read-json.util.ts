import { readValue } from '@vulcan/shared/utils/record-readers';

function readJson(record: unknown, fieldName: string): unknown {
    const value = readValue(record, fieldName);
    if (typeof value === 'string') {
        return JSON.parse(value);
    }
    return value;
}

function readStringArray(record: unknown, fieldName: string): string[] {
    const value = readJson(record, fieldName);
    if (!Array.isArray(value)) {
        throw new Error(`Expected array field '${fieldName}'`);
    }
    const items: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string' || item.trim().length === 0) {
            throw new Error(`Expected string items in '${fieldName}'`);
        }
        items.push(item);
    }
    return items;
}

export { readJson, readStringArray };
