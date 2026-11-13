import type { FunctionDefinition } from '../types.js';

type RecordValue = unknown;
type PipelineRecord = Record<string, RecordValue>;
type PipelineRecords = PipelineRecord[];

const RECORDS_RETURN = [
    {
        attribute_name: 'records',
        attribute_data_type: 'object[]',
        order: 1,
    },
];

const VALUE_RETURN = [
    {
        attribute_name: 'value',
        attribute_data_type: 'object',
        order: 1,
    },
];

function isRecord(value: unknown): value is PipelineRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecords(value: unknown): PipelineRecords {
    return Array.isArray(value) && value.every(isRecord) ? value : [];
}

function parseJsonObject(value: unknown): Record<string, unknown> {
    if (isRecord(value)) {
        return value;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        return {};
    }

    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) {
        throw new Error('Expected JSON object');
    }

    return parsed;
}

function parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        return [];
    }

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array');
    }

    return parsed;
}

function toNumber(value: unknown, fallback = 0): number {
    if (value === null || typeof value === 'undefined' || value === '') {
        return fallback;
    }

    const parsed = Number(stringifyValue(value).replace(/,/g, '').trim());

    return Number.isFinite(parsed) ? parsed : fallback;
}

function stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }

    if (value == null) {
        return '';
    }

    return JSON.stringify(value);
}

function cloneRecord(record: PipelineRecord): PipelineRecord {
    return { ...record };
}

function getValue(record: PipelineRecord, field: string): unknown {
    return field.split('.').reduce<unknown>((current, part) => {
        if (!isRecord(current)) {
            return undefined;
        }

        return current[part];
    }, record);
}

function setValue(record: PipelineRecord, field: string, value: unknown): void {
    record[field] = value;
}

function parseMaybeDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
        return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeDate(value: Date | null): string | null {
    return value ? value.toISOString() : null;
}

function buildDefinition(args: {
    name: string;
    description: string;
    attributes: Array<{
        name: string;
        type: string;
        order: number;
        required?: boolean;
        defaultValue?: string | null;
        quoteRender?: boolean;
    }>;
    returns?: 'records' | 'value';
    isAsync?: boolean;
}): FunctionDefinition {
    return {
        function_name: args.name,
        function_description: args.description,
        function_attributes: args.attributes.map((attribute) => ({
            attribute_name: attribute.name,
            attribute_data_type: attribute.type,
            order: attribute.order,
            required: attribute.required ?? true,
            default_value: attribute.defaultValue ?? null,
            default_quote_render: attribute.quoteRender ?? false,
        })),
        function_returns:
            args.returns === 'value' ? VALUE_RETURN : RECORDS_RETURN,
        is_async: args.isAsync ?? false,
    };
}

export const stripFieldsDefinition = buildDefinition({
    name: 'strip_fields',
    description: 'Trim whitespace and optional characters from string fields.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'fields', type: 'string[]', order: 2 },
        {
            name: 'chars',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: '"',
        },
    ],
});

export function strip_fields(args: {
    records: PipelineRecords;
    fields: string[];
    chars?: string;
}): PipelineRecords {
    const chars = args.chars ?? '"';

    return args.records.map((record) => {
        const updated = cloneRecord(record);
        for (const field of args.fields) {
            const value = getValue(updated, field);
            setValue(
                updated,
                field,
                value == null
                    ? ''
                    : stringifyValue(value)
                          .trim()
                          .replace(
                              new RegExp(`^[${chars}]+|[${chars}]+$`, 'g'),
                              '',
                          ),
            );
        }
        return updated;
    });
}

export const parseDateFieldDefinition = buildDefinition({
    name: 'parse_date_field',
    description: 'Parse a date-like field and write an ISO timestamp string.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: '',
        },
    ],
});

export function parse_date_field(args: {
    records: PipelineRecords;
    field: string;
    output_field?: string;
}): PipelineRecords {
    const outputField = args.output_field?.trim() || args.field;

    return args.records.map((record) => ({
        ...record,
        [outputField]: serializeDate(
            parseMaybeDate(getValue(record, args.field)),
        ),
    }));
}

export const upperFieldDefinition = buildDefinition({
    name: 'upper_field',
    description: 'Uppercase a string field into the same or another field.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: '',
        },
    ],
});

export function upper_field(args: {
    records: PipelineRecords;
    field: string;
    output_field?: string;
}): PipelineRecords {
    const outputField = args.output_field?.trim() || args.field;

    return args.records.map((record) => ({
        ...record,
        [outputField]: stringifyValue(getValue(record, args.field))
            .trim()
            .toUpperCase(),
    }));
}

export const mapFieldValuesDefinition = buildDefinition({
    name: 'map_field_values',
    description: 'Map field values through a JSON lookup object.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'mapping', type: 'object', order: 3 },
        {
            name: 'fallback',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: '',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 5,
            required: false,
            defaultValue: '',
        },
    ],
});

export function map_field_values(args: {
    records: PipelineRecords;
    field: string;
    mapping: Record<string, unknown> | string;
    fallback?: unknown;
    output_field?: string;
}): PipelineRecords {
    const mapping = parseJsonObject(args.mapping);
    const outputField = args.output_field?.trim() || args.field;

    return args.records.map((record) => {
        const value = getValue(record, args.field);
        const key = stringifyValue(value);
        return {
            ...record,
            [outputField]: Object.hasOwn(mapping, key)
                ? mapping[key]
                : args.fallback,
        };
    });
}

export const addConstantFieldDefinition = buildDefinition({
    name: 'add_constant_field',
    description: 'Add a constant value to every record.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'value', type: 'object', order: 3 },
    ],
});

export function add_constant_field(args: {
    records: PipelineRecords;
    field: string;
    value: unknown;
}): PipelineRecords {
    return args.records.map((record) => ({
        ...record,
        [args.field]: args.value,
    }));
}

export const selectFieldsDefinition = buildDefinition({
    name: 'select_fields',
    description: 'Keep only selected fields from each record.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'fields', type: 'string[]', order: 2 },
    ],
});

export function select_fields(args: {
    records: PipelineRecords;
    fields: string[];
}): PipelineRecords {
    return args.records.map((record) =>
        Object.fromEntries(
            args.fields.map((field) => [field, getValue(record, field)]),
        ),
    );
}

export const renameFieldsDefinition = buildDefinition({
    name: 'rename_fields',
    description:
        'Rename record fields using a JSON old_field -> new_field map.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'mapping', type: 'object', order: 2 },
    ],
});

export function rename_fields(args: {
    records: PipelineRecords;
    mapping: Record<string, unknown> | string;
}): PipelineRecords {
    const mapping = parseJsonObject(args.mapping);

    return args.records.map((record) => {
        const updated: PipelineRecord = {};
        for (const [key, value] of Object.entries(record)) {
            const mappedKey = mapping[key];
            updated[typeof mappedKey === 'string' ? mappedKey : key] = value;
        }
        return updated;
    });
}

export const filterRecordsDefinition = buildDefinition({
    name: 'filter_records',
    description: 'Filter records by a field comparison.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'value', type: 'object', order: 3 },
        {
            name: 'op',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: 'eq',
        },
    ],
});

export function filter_records(args: {
    records: PipelineRecords;
    field: string;
    value: unknown;
    op?: string;
}): PipelineRecords {
    const op = args.op ?? 'eq';
    return args.records.filter((record) => {
        const current = getValue(record, args.field);
        if (op === 'eq') return current === args.value;
        if (op === 'ne') return current !== args.value;
        if (op === 'contains')
            return stringifyValue(current).includes(stringifyValue(args.value));
        if (op === 'isin') return parseJsonArray(args.value).includes(current);
        const left = toNumber(current);
        const right = toNumber(args.value);
        if (op === 'gt') return left > right;
        if (op === 'gte') return left >= right;
        if (op === 'lt') return left < right;
        if (op === 'lte') return left <= right;
        throw new Error(`Unsupported filter op: ${op}`);
    });
}

export const headRecordsDefinition = buildDefinition({
    name: 'head_records',
    description: 'Return the first N records.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'limit', type: 'number', order: 2 },
    ],
});

export function head_records(args: {
    records: PipelineRecords;
    limit: number;
}): PipelineRecords {
    return args.records.slice(0, Number(args.limit));
}

export const sampleRecordsAcrossZipsDefinition = buildDefinition({
    name: 'sample_records_across_zips',
    description:
        'Round-robin sample records across zip_code buckets (US sales path).',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'limit', type: 'number', order: 2 },
        {
            name: 'zip_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'zip_code',
        },
    ],
});

export function sample_records_across_zips(args: {
    records: PipelineRecords;
    limit: number;
    zip_field?: string;
}): PipelineRecords {
    const limit = Math.max(0, Number(args.limit));
    if (!Number.isFinite(limit) || limit === 0) {
        return [];
    }

    const zipField = args.zip_field?.trim() || 'zip_code';
    const buckets = new Map<string, PipelineRecords>();

    for (const record of args.records) {
        const zipCode = stringifyValue(getValue(record, zipField))
            .replace(/\.0$/, '')
            .replace(/\D/g, '');
        if (!zipCode) {
            continue;
        }
        const bucket = buckets.get(zipCode) ?? [];
        bucket.push(record);
        buckets.set(zipCode, bucket);
    }

    const zipCodes = [...buckets.keys()];
    const sampled: PipelineRecords = [];
    let cursor = 0;

    while (sampled.length < limit && zipCodes.length > 0) {
        const index = cursor % zipCodes.length;
        const zipCode = zipCodes[index];
        const bucket = buckets.get(zipCode) ?? [];
        const next = bucket.shift();
        if (next) {
            sampled.push(next);
        }
        if (bucket.length === 0) {
            zipCodes.splice(index, 1);
            continue;
        }
        cursor += 1;
    }

    if (sampled.length > 0) {
        return sampled;
    }

    return head_records({
        records: args.records,
        limit,
    });
}

export const concatRecordsDefinition = buildDefinition({
    name: 'concat_records',
    description: 'Concatenate multiple record arrays.',
    attributes: [{ name: 'record_sets', type: 'object[]', order: 1 }],
});

export function concat_records(args: {
    record_sets: unknown[];
}): PipelineRecords {
    return args.record_sets.flatMap((recordSet) => asRecords(recordSet));
}

export const extractRegexFieldDefinition = buildDefinition({
    name: 'extract_regex_field',
    description: 'Extract a regex capture group into a field.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'pattern', type: 'string', order: 3 },
        { name: 'output_field', type: 'string', order: 4 },
    ],
});

export function extract_regex_field(args: {
    records: PipelineRecords;
    field: string;
    pattern: string;
    output_field: string;
}): PipelineRecords {
    const regex = new RegExp(args.pattern);

    return args.records.map((record) => {
        const match = regex.exec(stringifyValue(getValue(record, args.field)));
        return { ...record, [args.output_field]: match?.[1]?.trim() ?? null };
    });
}

export const toNumericFieldDefinition = buildDefinition({
    name: 'to_numeric_field',
    description: 'Convert a field to a number.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: '',
        },
        {
            name: 'default_value',
            type: 'number',
            order: 4,
            required: false,
            defaultValue: '0',
        },
    ],
});

export function to_numeric_field(args: {
    records: PipelineRecords;
    field: string;
    output_field?: string;
    default_value?: number;
}): PipelineRecords {
    const outputField = args.output_field?.trim() || args.field;
    return args.records.map((record) => ({
        ...record,
        [outputField]: toNumber(
            getValue(record, args.field),
            args.default_value ?? 0,
        ),
    }));
}

export const toNumericFieldsDefinition = buildDefinition({
    name: 'to_numeric_fields',
    description: 'Convert multiple fields to numbers on each record.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'fields', type: 'string[]', order: 2 },
        {
            name: 'default_value',
            type: 'number',
            order: 3,
            required: false,
            defaultValue: '0',
        },
    ],
});

export function to_numeric_fields(args: {
    records: PipelineRecords;
    fields: string[];
    default_value?: number;
}): PipelineRecords {
    return args.fields.reduce(
        (records, field) =>
            to_numeric_field({
                records,
                field,
                output_field: field,
                default_value: args.default_value,
            }),
        args.records,
    );
}

export const groupAndAggregateDefinition = buildDefinition({
    name: 'group_and_aggregate',
    description:
        'Group records and compute count/sum/mean/max/min aggregations.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'by', type: 'string', order: 2 },
        { name: 'aggs', type: 'object', order: 3 },
    ],
});

export function group_and_aggregate(args: {
    records: PipelineRecords;
    by: string;
    aggs: Record<string, unknown> | string;
}): PipelineRecords {
    const aggs = parseJsonObject(args.aggs);
    const groups = new Map<string, PipelineRecords>();

    for (const record of args.records) {
        const key = stringifyValue(getValue(record, args.by));
        const group = groups.get(key);
        if (group) {
            group.push(record);
        } else {
            groups.set(key, [record]);
        }
    }

    return [...groups.entries()].map(([key, records]) => {
        const row: PipelineRecord = { [args.by]: key };
        for (const [outputField, config] of Object.entries(aggs)) {
            if (!Array.isArray(config) || config.length !== 2) {
                throw new Error(
                    `Invalid aggregation config for ${outputField}`,
                );
            }
            const [sourceField, operation] = config.map(String);
            const values = records.map((record) =>
                toNumber(getValue(record, sourceField), 0),
            );
            if (operation === 'count') row[outputField] = records.length;
            else if (operation === 'sum')
                row[outputField] = values.reduce(
                    (sum, value) => sum + value,
                    0,
                );
            else if (operation === 'mean')
                row[outputField] =
                    values.reduce((sum, value) => sum + value, 0) /
                    Math.max(values.length, 1);
            else if (operation === 'max')
                row[outputField] = Math.max(...values);
            else if (operation === 'min')
                row[outputField] = Math.min(...values);
            else
                throw new Error(
                    `Unsupported aggregation operation: ${operation}`,
                );
        }
        return row;
    });
}

export const mergeRecordsDefinition = buildDefinition({
    name: 'merge_records',
    description: 'Left-merge two record arrays by key.',
    attributes: [
        { name: 'left', type: 'object[]', order: 1 },
        { name: 'right', type: 'object[]', order: 2 },
        { name: 'left_key', type: 'string', order: 3 },
        {
            name: 'right_key',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: '',
        },
    ],
});

export function merge_records(args: {
    left: PipelineRecords;
    right: PipelineRecords;
    left_key: string;
    right_key?: string;
}): PipelineRecords {
    const rightKey = args.right_key?.trim() || args.left_key;
    const rightByKey = new Map<string, PipelineRecord>();
    args.right.forEach((record) =>
        rightByKey.set(stringifyValue(getValue(record, rightKey)), record),
    );

    return args.left.map((leftRecord) => {
        const key = stringifyValue(getValue(leftRecord, args.left_key));

        return {
            ...leftRecord,
            ...(rightByKey.get(key) ?? {}),
        };
    });
}

function normalizeTaxLotPart(value: unknown): string {
    const parsed = toNumber(value, Number.NaN);

    if (!Number.isFinite(parsed)) {
        return '';
    }

    return String(Math.trunc(parsed));
}

export const addBblKeyFieldDefinition = buildDefinition({
    name: 'add_bbl_key_field',
    description:
        'Build canonical NYC BBL from borough_code, block, and lot fields.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'borough_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'borough_code',
            quoteRender: true,
        },
        {
            name: 'block_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'block',
            quoteRender: true,
        },
        {
            name: 'lot_field',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: 'lot',
            quoteRender: true,
        },
        {
            name: 'output_field',
            type: 'string',
            order: 5,
            required: false,
            defaultValue: 'bbl',
            quoteRender: true,
        },
    ],
});

export function add_bbl_key_field(args: {
    records: PipelineRecords;
    borough_field?: string;
    block_field?: string;
    lot_field?: string;
    output_field?: string;
}): PipelineRecords {
    const boroughField = args.borough_field ?? 'borough_code';
    const blockField = args.block_field ?? 'block';
    const lotField = args.lot_field ?? 'lot';
    const outputField = args.output_field ?? 'bbl';

    return args.records.map((record) => {
        const boroughCode = normalizeTaxLotPart(getValue(record, boroughField));
        const block = normalizeTaxLotPart(getValue(record, blockField));
        const lot = normalizeTaxLotPart(getValue(record, lotField));

        return {
            ...record,
            [outputField]: `${boroughCode}${block.padStart(5, '0')}${lot.padStart(4, '0')}`,
        };
    });
}

export const fillMissingFieldsDefinition = buildDefinition({
    name: 'fill_missing_fields',
    description: 'Fill null, undefined, or empty selected fields with a value.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'fields', type: 'string[]', order: 2 },
        {
            name: 'value',
            type: 'object',
            order: 3,
            required: false,
            defaultValue: '0',
        },
    ],
});

export function fill_missing_fields(args: {
    records: PipelineRecords;
    fields: string[];
    value?: unknown;
}): PipelineRecords {
    return args.records.map((record) => {
        const updated = { ...record };
        for (const field of args.fields) {
            const value = getValue(updated, field);
            if (
                value === null ||
                typeof value === 'undefined' ||
                value === ''
            ) {
                updated[field] = args.value ?? 0;
            }
        }
        return updated;
    });
}

export const normalizeToRangeDefinition = buildDefinition({
    name: 'normalize_to_range',
    description: 'Normalize a numeric field to a configured numeric range.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'output_field', type: 'string', order: 3 },
        {
            name: 'minimum',
            type: 'number',
            order: 4,
            required: false,
            defaultValue: '1',
        },
        {
            name: 'maximum',
            type: 'number',
            order: 5,
            required: false,
            defaultValue: '10',
        },
    ],
});

export function normalize_to_range(args: {
    records: PipelineRecords;
    field: string;
    output_field: string;
    minimum?: number;
    maximum?: number;
}): PipelineRecords {
    const min = Number(args.minimum ?? 1);
    const max = Number(args.maximum ?? 10);
    const values = args.records.map((record) =>
        toNumber(getValue(record, args.field), 0),
    );
    const sourceMin = Math.min(...values, 0);
    const sourceMax = Math.max(...values, 0);

    return args.records.map((record) => {
        const value = toNumber(getValue(record, args.field), 0);
        const normalized =
            sourceMax === sourceMin
                ? min
                : min +
                  ((value - sourceMin) / (sourceMax - sourceMin)) * (max - min);
        return {
            ...record,
            [args.output_field]: Number(normalized.toFixed(2)),
        };
    });
}

export const weightedSumDefinition = buildDefinition({
    name: 'weighted_sum',
    description: 'Compute a weighted numeric sum from fields.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'output_field', type: 'string', order: 2 },
        { name: 'fields', type: 'string[]', order: 3 },
        { name: 'weights', type: 'number[]', order: 4 },
    ],
});

export function weighted_sum(args: {
    records: PipelineRecords;
    output_field: string;
    fields: string[] | string;
    weights: number[] | string;
}): PipelineRecords {
    const fields = parseJsonArray(args.fields).map(String);
    const weights = parseJsonArray(args.weights).map(Number);

    return args.records.map((record) => ({
        ...record,
        [args.output_field]: Number(
            fields
                .reduce(
                    (total, field, index) =>
                        total +
                        toNumber(getValue(record, field), 0) *
                            Number(weights[index] ?? 0),
                    0,
                )
                .toFixed(2),
        ),
    }));
}

export const classifyByThresholdsDefinition = buildDefinition({
    name: 'classify_by_thresholds',
    description:
        'Classify a numeric field using descending threshold/label pairs.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'output_field', type: 'string', order: 3 },
        { name: 'thresholds', type: 'string[][]', order: 4 },
        { name: 'default_label', type: 'string', order: 5 },
    ],
});

export function classify_by_thresholds(args: {
    records: PipelineRecords;
    field: string;
    output_field: string;
    thresholds: Array<[number, string]> | string;
    default_label: string;
}): PipelineRecords {
    const thresholds = parseJsonArray(args.thresholds) as Array<
        [number, string]
    >;

    return args.records.map((record) => {
        const value = toNumber(getValue(record, args.field), 0);
        const matched = thresholds.find(
            ([threshold]) => value >= Number(threshold),
        );
        return {
            ...record,
            [args.output_field]: matched?.[1] ?? args.default_label,
        };
    });
}

export const computeAhpWeightsDefinition = buildDefinition({
    name: 'compute_ahp_weights',
    description: 'Compute AHP weights from a pairwise comparison matrix.',
    attributes: [{ name: 'pairwise', type: 'matrix', order: 1 }],
    returns: 'value',
});

export function compute_ahp_weights(args: {
    pairwise: number[][] | string;
}): number[] {
    const pairwise = parseJsonArray(args.pairwise) as number[][];
    const columnTotals = pairwise.map((_, columnIndex) =>
        pairwise.reduce(
            (total, row) => total + Number(row[columnIndex] ?? 0),
            0,
        ),
    );

    return pairwise.map(
        (row) =>
            row.reduce(
                (total, value, columnIndex) =>
                    total + Number(value) / columnTotals[columnIndex],
                0,
            ) / row.length,
    );
}

export const priceVsAverageDefinition = buildDefinition({
    name: 'price_vs_average',
    description:
        'Compute percentage difference between a record price and average price.',
    attributes: [
        { name: 'record', type: 'object', order: 1 },
        { name: 'price_field', type: 'string', order: 2 },
        { name: 'average_price', type: 'number', order: 3 },
    ],
    returns: 'value',
});

export function price_vs_average(args: {
    record: PipelineRecord;
    price_field: string;
    average_price: number;
}): number | null {
    const price = toNumber(getValue(args.record, args.price_field), Number.NaN);
    if (!Number.isFinite(price) || !args.average_price) {
        return null;
    }
    return Number(
        (((price - args.average_price) / args.average_price) * 100).toFixed(1),
    );
}

export const marketHeatScoreDefinition = buildDefinition({
    name: 'market_heat_score',
    description:
        'Compute market heat score from year-over-year change percentage.',
    attributes: [{ name: 'yoy_change_pct', type: 'number', order: 1 }],
    returns: 'value',
});

export function market_heat_score(args: { yoy_change_pct: number }): number {
    return Math.round(
        Math.min(100, Math.max(1, Number(args.yoy_change_pct ?? 0) * 15)),
    );
}

export const addMarketHeatScoreFieldDefinition = buildDefinition({
    name: 'add_market_heat_score_field',
    description:
        'Add market_heat_score on each record from its year-over-year change field.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'yoy_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'yoy_change_pct',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'market_heat_score',
        },
    ],
});

export function add_market_heat_score_field(args: {
    records: PipelineRecords;
    yoy_field?: string;
    output_field?: string;
}): PipelineRecords {
    const yoyField = args.yoy_field?.trim() || 'yoy_change_pct';
    const outputField = args.output_field?.trim() || 'market_heat_score';

    return args.records.map((record) => ({
        ...record,
        [outputField]: market_heat_score({
            yoy_change_pct: toNumber(getValue(record, yoyField), 0),
        }),
    }));
}

/**
 * Absolute heat from CAGR/growth % using fixed bands (1–10).
 * Bands are checked high-to-low on minInclusive thresholds.
 * Default matches debug MARKET_HEAT_GROWTH_BANDS.
 */
const DEFAULT_MARKET_HEAT_GROWTH_BANDS: Array<[number, number]> = [
    [8, 10],
    [7, 9],
    [6, 8],
    [5, 7],
    [4, 6],
    [3, 5],
    [2, 4],
    [Number.NEGATIVE_INFINITY, 2],
];

function parseGrowthBands(value: unknown): Array<[number, number]> {
    if (value === null || typeof value === 'undefined' || value === '') {
        return DEFAULT_MARKET_HEAT_GROWTH_BANDS;
    }

    const entries = parseJsonArray(value);
    const bands: Array<[number, number]> = [];

    for (const entry of entries) {
        if (!Array.isArray(entry) || entry.length < 2) {
            continue;
        }

        const minRaw = entry[0];
        const score = Number(entry[1]);
        const minInclusive =
            minRaw === null ||
            typeof minRaw === 'undefined' ||
            minRaw === '' ||
            minRaw === '-Infinity'
                ? Number.NEGATIVE_INFINITY
                : Number(minRaw);

        if (!Number.isFinite(score)) {
            continue;
        }
        if (
            minInclusive !== Number.NEGATIVE_INFINITY &&
            !Number.isFinite(minInclusive)
        ) {
            continue;
        }

        bands.push([minInclusive, score]);
    }

    return bands.length > 0 ? bands : DEFAULT_MARKET_HEAT_GROWTH_BANDS;
}

function marketHeatFromGrowthBands(args: {
    growthPct: number;
    bands: Array<[number, number]>;
}): number {
    for (const [minInclusive, score] of args.bands) {
        if (args.growthPct >= minInclusive) {
            return score;
        }
    }

    return 2;
}

export const addMarketHeatFromGrowthBandsDefinition = buildDefinition({
    name: 'add_market_heat_from_growth_bands',
    description:
        'Add a 1-10 market heat score from absolute growth/CAGR bands (US path).',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'growth_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'hpi_cagr_pct',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'market_heat_score',
        },
        {
            name: 'bands',
            type: 'object[]',
            order: 4,
            required: false,
            defaultValue:
                '[[8,10],[7,9],[6,8],[5,7],[4,6],[3,5],[2,4],[null,2]]',
        },
    ],
});

export function add_market_heat_from_growth_bands(args: {
    records: PipelineRecords;
    growth_field?: string;
    output_field?: string;
    bands?: unknown;
}): PipelineRecords {
    const growthField = args.growth_field?.trim() || 'hpi_cagr_pct';
    const outputField = args.output_field?.trim() || 'market_heat_score';
    const bands = parseGrowthBands(args.bands);

    const scored: PipelineRecords = [];
    for (const record of args.records) {
        scored.push({
            ...record,
            [outputField]: marketHeatFromGrowthBands({
                growthPct: toNumber(getValue(record, growthField), 0),
                bands,
            }),
        });
    }
    return scored;
}

export const meanNumericFieldDefinition = buildDefinition({
    name: 'mean_numeric_field',
    description:
        'Compute the arithmetic mean of a numeric field across records.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        {
            name: 'decimals',
            type: 'number',
            order: 3,
            required: false,
        },
    ],
    returns: 'value',
});

export function mean_numeric_field(args: {
    records: PipelineRecords;
    field: string;
    decimals?: number;
}): number | null {
    const values = args.records
        .map((record) => toNumber(getValue(record, args.field), Number.NaN))
        .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
        return null;
    }

    const mean =
        values.reduce((total, value) => total + value, 0) / values.length;

    if (args.decimals === undefined || args.decimals === null) {
        return mean;
    }

    const decimals = Number(args.decimals);
    if (!Number.isFinite(decimals) || decimals < 0) {
        return mean;
    }

    return Number(mean.toFixed(decimals));
}

export const addPriceVsAvgFieldDefinition = buildDefinition({
    name: 'add_price_vs_avg_field',
    description:
        'Add price_vs_avg_pct on each record from price and a regional average field.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'price_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'price',
        },
        {
            name: 'average_price_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'regional_avg_price',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: 'price_vs_avg_pct',
        },
    ],
});

export function add_price_vs_avg_field(args: {
    records: PipelineRecords;
    price_field?: string;
    average_price_field?: string;
    output_field?: string;
}): PipelineRecords {
    const priceField = args.price_field?.trim() || 'price';
    const averagePriceField =
        args.average_price_field?.trim() || 'regional_avg_price';
    const outputField = args.output_field?.trim() || 'price_vs_avg_pct';

    return args.records.map((record) => {
        const averagePrice = toNumber(
            getValue(record, averagePriceField),
            Number.NaN,
        );

        return {
            ...record,
            [outputField]: price_vs_average({
                record,
                price_field: priceField,
                average_price: averagePrice,
            }),
        };
    });
}

export const marketPositionScoreDefinition = buildDefinition({
    name: 'market_position_score',
    description: 'Compute investment market-position score from price gap.',
    attributes: [
        { name: 'record', type: 'object', order: 1 },
        { name: 'price_field', type: 'string', order: 2 },
        { name: 'average_price', type: 'number', order: 3 },
    ],
    returns: 'value',
});

export function market_position_score(args: {
    record: PipelineRecord;
    price_field: string;
    average_price: number;
}): number {
    const gap = price_vs_average({
        record: args.record,
        price_field: args.price_field,
        average_price: args.average_price,
    });

    return gap === null
        ? 5
        : Math.max(1, Math.min(10, Math.round(5 - gap / 20)));
}

export const addMarketPositionScoreFieldDefinition = buildDefinition({
    name: 'add_market_position_score_field',
    description:
        'Add market position score from sale price vs neighborhood average.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'price_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'price',
        },
        {
            name: 'average_price_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'neighborhood_avg_price',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 4,
            required: false,
            defaultValue: 'market_position_score',
        },
    ],
});

export function add_market_position_score_field(args: {
    records: PipelineRecords;
    price_field?: string;
    average_price_field?: string;
    output_field?: string;
}): PipelineRecords {
    const priceField = args.price_field?.trim() || 'price';
    const averagePriceField =
        args.average_price_field?.trim() || 'neighborhood_avg_price';
    const outputField = args.output_field?.trim() || 'market_position_score';

    return args.records.map((record) => ({
        ...record,
        [outputField]: market_position_score({
            record,
            price_field: priceField,
            average_price: toNumber(getValue(record, averagePriceField), 0),
        }),
    }));
}

export const scaleNumericFieldDefinition = buildDefinition({
    name: 'scale_numeric_field',
    description:
        'Divide a numeric field by a divisor and write the result to a new field.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'divisor', type: 'number', order: 3 },
        {
            name: 'output_field',
            type: 'string',
            order: 4,
            required: false,
        },
        {
            name: 'decimals',
            type: 'number',
            order: 5,
            required: false,
        },
    ],
});

export function scale_numeric_field(args: {
    records: PipelineRecords;
    field: string;
    divisor: number;
    output_field?: string;
    decimals?: number;
}): PipelineRecords {
    const outputField = args.output_field?.trim() || args.field;
    const divisor = args.divisor === 0 ? 1 : args.divisor;
    const decimals = args.decimals ?? 1;

    return args.records.map((record) => ({
        ...record,
        [outputField]: Number(
            (toNumber(getValue(record, args.field), 0) / divisor).toFixed(
                decimals,
            ),
        ),
    }));
}

export const riskSafetyScoreDefinition = buildDefinition({
    name: 'risk_safety_score',
    description: 'Invert composite risk score into a safety score.',
    attributes: [
        { name: 'record', type: 'object', order: 1 },
        {
            name: 'risk_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'composite_risk_score',
        },
    ],
    returns: 'value',
});

export function risk_safety_score(args: {
    record: PipelineRecord;
    risk_field?: string;
}): number {
    return Number(
        (
            10 -
            toNumber(
                getValue(
                    args.record,
                    args.risk_field ?? 'composite_risk_score',
                ),
                5,
            )
        ).toFixed(2),
    );
}

export const addRiskSafetyScoreFieldDefinition = buildDefinition({
    name: 'add_risk_safety_score_field',
    description:
        'Add a risk safety score field by inverting a composite risk score.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'risk_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'composite_risk_score',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'risk_safety_score',
        },
    ],
});

export function add_risk_safety_score_field(args: {
    records: PipelineRecords;
    risk_field?: string;
    output_field?: string;
}): PipelineRecords {
    const riskField = args.risk_field?.trim() || 'composite_risk_score';
    const outputField = args.output_field?.trim() || 'risk_safety_score';

    return args.records.map((record) => ({
        ...record,
        [outputField]: risk_safety_score({
            record,
            risk_field: riskField,
        }),
    }));
}

export const addMacroHealthScoreFieldDefinition = buildDefinition({
    name: 'add_macro_health_score_field',
    description:
        'Add a macro health score field by clamping a macro growth score to 1-10.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        {
            name: 'macro_field',
            type: 'string',
            order: 2,
            required: false,
            defaultValue: 'macro_growth_score',
        },
        {
            name: 'output_field',
            type: 'string',
            order: 3,
            required: false,
            defaultValue: 'macro_health_score',
        },
    ],
});

export function add_macro_health_score_field(args: {
    records: PipelineRecords;
    macro_field?: string;
    output_field?: string;
}): PipelineRecords {
    const macroField = args.macro_field?.trim() || 'macro_growth_score';
    const outputField = args.output_field?.trim() || 'macro_health_score';

    // macro_growth_score is already 1–10 (growth bands); missing → cautious low.
    return args.records.map((record) => {
        const macroGrowth = toNumber(getValue(record, macroField), 1);
        return {
            ...record,
            [outputField]: Math.max(
                1,
                Math.min(10, Number(macroGrowth.toFixed(2))),
            ),
        };
    });
}

export const addRatioPctFieldDefinition = buildDefinition({
    name: 'add_ratio_pct_field',
    description:
        'Add a percentage field as (numerator / denominator) * 100, rounded to 1 decimal.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'numerator_field', type: 'string', order: 2 },
        { name: 'denominator_field', type: 'string', order: 3 },
        { name: 'output_field', type: 'string', order: 4 },
    ],
});

export function add_ratio_pct_field(args: {
    records: PipelineRecords;
    numerator_field: string;
    denominator_field: string;
    output_field: string;
}): PipelineRecords {
    return args.records.map((record) => {
        const numerator = toNumber(getValue(record, args.numerator_field), 0);
        const denominator = toNumber(
            getValue(record, args.denominator_field),
            0,
        );
        const pct =
            denominator > 0
                ? Number(((numerator / denominator) * 100).toFixed(1))
                : null;

        return {
            ...record,
            [args.output_field]: pct,
        };
    });
}

export const buildRegionIdDefinition = buildDefinition({
    name: 'build_region_id',
    description:
        'Build a normalized region ID from country and region strings.',
    attributes: [
        { name: 'country', type: 'string', order: 1 },
        { name: 'region', type: 'string', order: 2 },
    ],
    returns: 'value',
});

export function build_region_id(args: {
    country: string;
    region: string;
}): string {
    return `${args.country}-${args.region.toUpperCase().replace(/\s+/g, '_')}`;
}

export const parseNoaaDamageFieldDefinition = buildDefinition({
    name: 'parse_noaa_damage_field',
    description:
        'Parse NOAA damage shorthand values such as 2.5M into numeric USD.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'field', type: 'string', order: 2 },
        { name: 'output_field', type: 'string', order: 3 },
    ],
});

export function parse_noaa_damage_field(args: {
    records: PipelineRecords;
    field: string;
    output_field: string;
}): PipelineRecords {
    return args.records.map((record) => {
        const text = stringifyValue(getValue(record, args.field))
            .trim()
            .toUpperCase();
        const match = /^([0-9.]+)\s*([KMB])?$/.exec(text);
        const multiplier =
            { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[
                match?.[2] as 'K' | 'M' | 'B'
            ] ?? 1;
        return {
            ...record,
            [args.output_field]: match
                ? Number(match[1]) * multiplier
                : toNumber(text, 0),
        };
    });
}

const NY_RISK_PEERS = [
    {
        city: 'NEW YORK',
        regionId: 'US-NYC',
        latitude: 40.7128,
        longitude: -74.006,
    },
    {
        city: 'BUFFALO',
        regionId: 'US-NY-BUFFALO',
        latitude: 42.8864,
        longitude: -78.8784,
    },
    {
        city: 'ROCHESTER',
        regionId: 'US-NY-ROCHESTER',
        latitude: 43.1566,
        longitude: -77.6088,
    },
    {
        city: 'YONKERS',
        regionId: 'US-NY-YONKERS',
        latitude: 40.9312,
        longitude: -73.8987,
    },
    {
        city: 'SYRACUSE',
        regionId: 'US-NY-SYRACUSE',
        latitude: 43.0481,
        longitude: -76.1474,
    },
    {
        city: 'ALBANY',
        regionId: 'US-NY-ALBANY',
        latitude: 42.6526,
        longitude: -73.7562,
    },
] as const;

const NY_STORM_ZONE_TO_CITY: Record<string, string> = {
    QUEENS: 'NEW YORK',
    KINGS: 'NEW YORK',
    BROOKLYN: 'NEW YORK',
    BRONX: 'NEW YORK',
    'NEW YORK': 'NEW YORK',
    MANHATTAN: 'NEW YORK',
    RICHMOND: 'NEW YORK',
    'STATEN ISLAND': 'NEW YORK',
    NASSAU: 'NEW YORK',
    SUFFOLK: 'NEW YORK',
    WESTCHESTER: 'YONKERS',
    ERIE: 'BUFFALO',
    NIAGARA: 'BUFFALO',
    MONROE: 'ROCHESTER',
    ONONDAGA: 'SYRACUSE',
    ALBANY: 'ALBANY',
    SCHENECTADY: 'ALBANY',
    RENSSELAER: 'ALBANY',
    SARATOGA: 'ALBANY',
};

function normalizeLabel(value: unknown): string {
    return stringifyValue(value).trim().toUpperCase().replace(/\s+/g, ' ');
}

function findNyRiskPeer(city: string) {
    return NY_RISK_PEERS.find((peer) => peer.city === city);
}

function nearestNyRiskPeer(args: { latitude: number; longitude: number }) {
    let nearest: (typeof NY_RISK_PEERS)[number] | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const peer of NY_RISK_PEERS) {
        const distance = Math.hypot(
            args.latitude - peer.latitude,
            args.longitude - peer.longitude,
        );
        if (distance < nearestDistance) {
            nearest = peer;
            nearestDistance = distance;
        }
    }
    return nearestDistance <= 0.9 ? nearest : undefined;
}

export const assignNyRiskPeerFieldDefinition = buildDefinition({
    name: 'assign_ny_risk_peer_field',
    description:
        'Assign New York earthquake, storm, or crime rows to supported city risk peers.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'source', type: 'string', order: 2 },
    ],
});

export function assign_ny_risk_peer_field(args: {
    records: PipelineRecords;
    source: 'earthquake' | 'storm' | 'crime';
}): PipelineRecords {
    const records: PipelineRecords = [];

    for (const record of args.records) {
        let peer: (typeof NY_RISK_PEERS)[number] | undefined;
        if (args.source === 'earthquake') {
            if (normalizeLabel(record.type) !== 'EARTHQUAKE') {
                continue;
            }
            peer = nearestNyRiskPeer({
                latitude: toNumber(record.latitude, Number.NaN),
                longitude: toNumber(record.longitude, Number.NaN),
            });
        } else if (args.source === 'storm') {
            if (normalizeLabel(record.STATE) !== 'NEW YORK') {
                continue;
            }
            peer = findNyRiskPeer(
                NY_STORM_ZONE_TO_CITY[normalizeLabel(record.CZ_NAME)] ?? '',
            );
        } else {
            if (normalizeLabel(record.state) !== 'NEW YORK') {
                continue;
            }
            peer = findNyRiskPeer(normalizeLabel(record.city));
        }

        if (!peer) {
            continue;
        }

        const enriched: PipelineRecord = {
            ...record,
            city: peer.city,
            region_id: peer.regionId,
            country: 'US',
        };
        if (args.source === 'crime') {
            const population = toNumber(record.population, 0);
            enriched.violent_crime_rate_per_100k =
                population > 0
                    ? Number(
                          (
                              (toNumber(record.violent_crime, 0) / population) *
                              100_000
                          ).toFixed(2),
                      )
                    : 0;
            enriched.property_crime_rate_per_100k =
                population > 0
                    ? Number(
                          (
                              (toNumber(record.property_crime, 0) /
                                  population) *
                              100_000
                          ).toFixed(2),
                      )
                    : 0;
        }
        records.push(enriched);
    }
    return records;
}

const NYC_BOROUGH_CENTROIDS = [
    {
        borough: 'MANHATTAN',
        latitude: 40.7831,
        longitude: -73.9712,
    },
    {
        borough: 'BRONX',
        latitude: 40.8448,
        longitude: -73.8648,
    },
    {
        borough: 'BROOKLYN',
        latitude: 40.6782,
        longitude: -73.9442,
    },
    {
        borough: 'QUEENS',
        latitude: 40.7282,
        longitude: -73.7949,
    },
    {
        borough: 'STATEN_ISLAND',
        latitude: 40.5795,
        longitude: -74.1502,
    },
] as const;

const NY_RISK_BOROUGH_MATCH_MAX_KM = 35;

const NY_STORM_ZONE_TO_BOROUGH: Record<string, string> = {
    QUEENS: 'QUEENS',
    KINGS: 'BROOKLYN',
    BROOKLYN: 'BROOKLYN',
    BRONX: 'BRONX',
    'NEW YORK': 'MANHATTAN',
    'NEW YORK (MANHATTAN)': 'MANHATTAN',
    MANHATTAN: 'MANHATTAN',
    RICHMOND: 'STATEN_ISLAND',
    STATEN: 'STATEN_ISLAND',
    'STATEN ISLAND': 'STATEN_ISLAND',
};

function haversineKm(args: {
    latitude: number;
    longitude: number;
    otherLatitude: number;
    otherLongitude: number;
}): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(args.otherLatitude - args.latitude);
    const dLon = toRadians(args.otherLongitude - args.longitude);
    const lat1 = toRadians(args.latitude);
    const lat2 = toRadians(args.otherLatitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNycBorough(args: {
    latitude: number;
    longitude: number;
}): (typeof NYC_BOROUGH_CENTROIDS)[number] | undefined {
    let nearest: (typeof NYC_BOROUGH_CENTROIDS)[number] | undefined;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    for (const borough of NYC_BOROUGH_CENTROIDS) {
        const distanceKm = haversineKm({
            latitude: args.latitude,
            longitude: args.longitude,
            otherLatitude: borough.latitude,
            otherLongitude: borough.longitude,
        });
        if (distanceKm < nearestDistanceKm) {
            nearest = borough;
            nearestDistanceKm = distanceKm;
        }
    }

    if (!nearest || nearestDistanceKm > NY_RISK_BOROUGH_MATCH_MAX_KM) {
        return undefined;
    }
    return nearest;
}

function resolveStormBorough(record: PipelineRecord): string | undefined {
    const latitude = toNumber(record.BEGIN_LAT, Number.NaN);
    const longitude = toNumber(record.BEGIN_LON, Number.NaN);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        // Ignore null-island / empty-coerced zeros so CZ_NAME can still match.
        if (!(latitude === 0 && longitude === 0)) {
            const nearest = nearestNycBorough({ latitude, longitude });
            if (nearest) {
                return nearest.borough;
            }
        }
    }

    const zoneName = normalizeLabel(record.CZ_NAME);
    if (!zoneName) {
        return undefined;
    }

    const direct = NY_STORM_ZONE_TO_BOROUGH[zoneName];
    if (direct) {
        return direct;
    }

    for (const [zoneToken, borough] of Object.entries(
        NY_STORM_ZONE_TO_BOROUGH,
    )) {
        if (zoneName.includes(zoneToken)) {
            return borough;
        }
    }
    return undefined;
}

export const assignNyRiskBoroughFieldDefinition = buildDefinition({
    name: 'assign_ny_risk_borough_field',
    description:
        'Assign New York earthquake or storm rows to NYC boroughs for natural risk.',
    attributes: [
        { name: 'records', type: 'object[]', order: 1 },
        { name: 'source', type: 'string', order: 2 },
    ],
});

export function assign_ny_risk_borough_field(args: {
    records: PipelineRecords;
    source: 'earthquake' | 'storm';
}): PipelineRecords {
    const records: PipelineRecords = [];

    for (const record of args.records) {
        let borough: string | undefined;

        if (args.source === 'earthquake') {
            if (normalizeLabel(record.type) !== 'EARTHQUAKE') {
                continue;
            }
            borough = nearestNycBorough({
                latitude: toNumber(record.latitude, Number.NaN),
                longitude: toNumber(record.longitude, Number.NaN),
            })?.borough;
        } else {
            if (normalizeLabel(record.STATE) !== 'NEW YORK') {
                continue;
            }
            borough = resolveStormBorough(record);
        }

        if (!borough) {
            continue;
        }

        records.push({
            ...record,
            borough,
            country: 'US',
            region_id: 'US-NYC',
        });
    }

    return records;
}

export const fetchEntityRecordsDefinition = buildDefinition({
    name: 'fetch_entity_records',
    description: 'Load records from an entity table by entity name.',
    isAsync: true,
    attributes: [
        { name: 'entity_name', type: 'string', order: 1 },
        { name: 'dataSource', type: 'object', order: 2 },
        {
            name: 'limit',
            type: 'number',
            order: 3,
            required: false,
        },
    ],
});

export { fetch_entity_records } from '@vyapti/core/entity-ingest-tool-utils';

export const investmentRecordFunctionDefinitions = [
    stripFieldsDefinition,
    parseDateFieldDefinition,
    upperFieldDefinition,
    mapFieldValuesDefinition,
    addConstantFieldDefinition,
    selectFieldsDefinition,
    renameFieldsDefinition,
    filterRecordsDefinition,
    headRecordsDefinition,
    sampleRecordsAcrossZipsDefinition,
    concatRecordsDefinition,
    extractRegexFieldDefinition,
    toNumericFieldDefinition,
    groupAndAggregateDefinition,
    mergeRecordsDefinition,
    addBblKeyFieldDefinition,
    fillMissingFieldsDefinition,
    normalizeToRangeDefinition,
    weightedSumDefinition,
    classifyByThresholdsDefinition,
    computeAhpWeightsDefinition,
    priceVsAverageDefinition,
    marketHeatScoreDefinition,
    addMarketHeatScoreFieldDefinition,
    addMarketHeatFromGrowthBandsDefinition,
    marketPositionScoreDefinition,
    riskSafetyScoreDefinition,
    addRiskSafetyScoreFieldDefinition,
    addMacroHealthScoreFieldDefinition,
    buildRegionIdDefinition,
    parseNoaaDamageFieldDefinition,
    assignNyRiskPeerFieldDefinition,
    assignNyRiskBoroughFieldDefinition,
    fetchEntityRecordsDefinition,
] satisfies FunctionDefinition[];
