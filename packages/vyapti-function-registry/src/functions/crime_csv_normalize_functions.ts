import type { FunctionDefinition } from '../types.js';
import { parseCsvTextToGrid } from './csv_text_utils.js';

type PipelineRecord = Record<string, unknown>;
type PipelineRecords = PipelineRecord[];

const TEXT_RETURN = [
    {
        attribute_name: 'text',
        attribute_data_type: 'string',
        order: 1,
    },
];

const TEXT_INPUT = [
    {
        attribute_name: 'text',
        attribute_data_type: 'string',
        order: 1,
        required: true,
        default_value: null,
        default_quote_render: false,
    },
] as const;

const FBI_CRIME_METADATA_ROW_COUNT = 3;
const FBI_CRIME_HEADER_ROW_COUNT = 1;

const FBI_CRIME_COLUMNS = [
    'state',
    'city',
    'population',
    'violent_crime',
    'murder',
    'rape',
    'robbery',
    'aggravated_assault',
    'property_crime',
    'burglary',
    'larceny_theft',
    'motor_vehicle_theft',
    'arson',
] as const;

function valueIsMissing(value: unknown): boolean {
    return value === null || value === undefined || value === '';
}

function escapeCsvCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
        return '';
    }

    const stringValue = String(value);
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function recordsToCsvText(
    records: PipelineRecords,
    columns: readonly string[],
): string {
    const lines = [
        columns.join(','),
        ...records.map((record) =>
            columns.map((column) => escapeCsvCell(record[column])).join(','),
        ),
    ];

    return lines.join('\n');
}

function mapGridRowToRecord(cells: string[]): PipelineRecord {
    return Object.fromEntries(
        FBI_CRIME_COLUMNS.map((column, index) => [
            column,
            cells[index]?.trim() || null,
        ]),
    );
}

function dropMissingRecords(args: {
    records: PipelineRecords;
    subset: string[];
}): PipelineRecords {
    return args.records.filter((record) =>
        args.subset.every((field) => !valueIsMissing(record[field])),
    );
}

function forwardFillField(args: {
    records: PipelineRecords;
    field: string;
}): PipelineRecords {
    let lastValue: unknown;

    return args.records.map((record) => {
        const currentValue = record[args.field];
        if (!valueIsMissing(currentValue)) {
            lastValue = currentValue;
            return record;
        }

        return { ...record, [args.field]: lastValue };
    });
}

function extractFbiCrimeRecords(grid: string[][]): PipelineRecords {
    const dataRows = grid.slice(
        FBI_CRIME_METADATA_ROW_COUNT + FBI_CRIME_HEADER_ROW_COUNT,
    );
    const mapped = dataRows.map((row) => mapGridRowToRecord(row));
    const withCity = dropMissingRecords({
        records: mapped,
        subset: ['city'],
    });

    return forwardFillField({
        records: withCity,
        field: 'state',
    });
}

export const normalizeFbiCrimeGridCsvDefinition = {
    function_name: 'normalize_fbi_crime_grid_csv',
    function_description:
        'Normalize FBI Table 8 (24tbl08) Excel CSV export into headered city crime CSV rows with forward-filled state values.',
    function_attributes: [...TEXT_INPUT],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_fbi_crime_grid_csv({
    text,
}: {
    text: string;
}): string {
    const grid = parseCsvTextToGrid(text);
    const records = extractFbiCrimeRecords(grid);
    return recordsToCsvText(records, FBI_CRIME_COLUMNS);
}

export const crimeCsvNormalizeFunctionDefinitions = [
    normalizeFbiCrimeGridCsvDefinition,
] satisfies FunctionDefinition[];
