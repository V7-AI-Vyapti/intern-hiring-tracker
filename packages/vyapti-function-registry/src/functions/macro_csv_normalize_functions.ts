import type { FunctionDefinition } from '../types.js';
import { parseCsvTextToGrid, type CsvGrid } from './csv_text_utils.js';

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

const CONSTRUCTION_SPENDING_CATEGORIES = [
    'Total Construction',
    'Residential',
    'Nonresidential',
] as const;

const CONSTRUCTION_SPENDING_COLUMN_COUNT = 6;

function normalizeGridLabel(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeConstructionPeriodLabel(month: string): string {
    return `2024-${normalizeGridLabel(month)}`;
}

function findConstructionMonthsRow(grid: CsvGrid): string[] {
    for (const row of grid) {
        const label = normalizeGridLabel(row[0] ?? '');
        if (label.includes('Type of Construction')) {
            return row;
        }
    }

    return grid[4] ?? [];
}

function findConstructionCategoryRow(
    grid: CsvGrid,
    category: string,
): string[] {
    for (const row of grid) {
        if (normalizeGridLabel(row[0] ?? '') === category) {
            return row;
        }
    }

    return [];
}

function parseNumericCell(value: string): number | null {
    const parsed = Number.parseFloat(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
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

function unpivotConstructionSpendingRecords(grid: CsvGrid): PipelineRecords {
    const monthsRow = findConstructionMonthsRow(grid);
    const months = monthsRow
        .slice(1, 1 + CONSTRUCTION_SPENDING_COLUMN_COUNT)
        .filter((month) => month.trim());
    const records: PipelineRecords = [];

    CONSTRUCTION_SPENDING_CATEGORIES.forEach((category) => {
        const row = findConstructionCategoryRow(grid, category);
        months.forEach((month, monthIndex) => {
            const spending = parseNumericCell(row[monthIndex + 1] ?? '');
            records.push({
                period: normalizeConstructionPeriodLabel(month),
                category,
                spending_millions_usd: spending,
            });
        });
    });

    return records;
}

function extractQuarterlyGdpRecords(grid: CsvGrid): PipelineRecords {
    const headerRow = grid[7] ?? [];
    const dataRow = grid[8] ?? [];
    const records: PipelineRecords = [];

    for (
        let columnIndex = 3;
        columnIndex < headerRow.length;
        columnIndex += 1
    ) {
        const quarter = headerRow[columnIndex]?.trim() ?? '';
        if (
            !quarter ||
            !['2024', '2025'].some((year) => quarter.includes(year))
        ) {
            continue;
        }

        const gdpPctChange = parseNumericCell(dataRow[columnIndex] ?? '');
        if (gdpPctChange === null) {
            continue;
        }

        records.push({
            period: quarter,
            gdp_pct_change: gdpPctChange,
        });
    }

    return records;
}

function extractMonthlyCpiRecords(grid: CsvGrid): PipelineRecords {
    const monthsRow = grid[4] ?? [];
    const dataRow = grid[7] ?? [];
    const records: PipelineRecords = [];

    for (
        let columnIndex = 3;
        columnIndex < monthsRow.length;
        columnIndex += 1
    ) {
        const month = monthsRow[columnIndex]?.trim() ?? '';
        if (!month) {
            continue;
        }

        records.push({
            period: month,
            cpi_all_items: parseNumericCell(dataRow[columnIndex] ?? ''),
        });
    }

    return records;
}

export const normalizeConstructionSpendingCsvDefinition = {
    function_name: 'normalize_construction_spending_csv',
    function_description:
        'Normalize construction spending Table1 Excel CSV export into headered CSV rows.',
    function_attributes: [...TEXT_INPUT],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_construction_spending_csv({
    text,
}: {
    text: string;
}): string {
    const grid = parseCsvTextToGrid(text);
    const records = unpivotConstructionSpendingRecords(grid);
    return recordsToCsvText(records, [
        'period',
        'category',
        'spending_millions_usd',
    ]);
}

export const normalizeGdpGridCsvDefinition = {
    function_name: 'normalize_gdp_grid_csv',
    function_description:
        'Normalize BEA T10101-Q Excel CSV export into headered quarterly GDP CSV rows.',
    function_attributes: [...TEXT_INPUT],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_gdp_grid_csv({ text }: { text: string }): string {
    const grid = parseCsvTextToGrid(text);
    const records = extractQuarterlyGdpRecords(grid);
    return recordsToCsvText(records, ['period', 'gdp_pct_change']);
}

export const normalizeCpiGridCsvDefinition = {
    function_name: 'normalize_cpi_grid_csv',
    function_description:
        'Normalize BLS CPI US sheet Excel CSV export into headered monthly CPI CSV rows.',
    function_attributes: [...TEXT_INPUT],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_cpi_grid_csv({ text }: { text: string }): string {
    const grid = parseCsvTextToGrid(text);
    const records = extractMonthlyCpiRecords(grid);
    return recordsToCsvText(records, ['period', 'cpi_all_items']);
}

export const macroCsvNormalizeFunctionDefinitions = [
    normalizeConstructionSpendingCsvDefinition,
    normalizeGdpGridCsvDefinition,
    normalizeCpiGridCsvDefinition,
] satisfies FunctionDefinition[];
