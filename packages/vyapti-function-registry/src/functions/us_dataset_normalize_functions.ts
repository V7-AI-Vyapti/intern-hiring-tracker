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

const NYC_HEADER_MARKER = 'BOROUGH';
const NYC_SALE_COLUMNS = [
    'borough_code',
    'neighborhood',
    'property_type',
    'block',
    'lot',
    'address',
    'apartment_number',
    'zip_code',
    'sale_price',
    'sale_date',
] as const;

const DEFAULT_US_HPI_PLACE_NAME =
    'New York-Jersey City-White Plains, NY-NJ (MSAD)';
const DEFAULT_US_HPI_FILTER_YEAR = '2024';

function normalizeGridLabel(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function parseNumericCell(value: string): number | null {
    const parsed = Number.parseFloat(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
}

function toText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
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

function parseMaybeDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        const milliseconds = (value - 25569) * 86_400_000;
        const parsed = new Date(milliseconds);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        return null;
    }

    const trimmed = value.trim();
    const numeric = Number.parseFloat(trimmed.replace(/,/g, ''));
    if (
        Number.isFinite(numeric) &&
        numeric > 30_000 &&
        !trimmed.includes('/')
    ) {
        const milliseconds = (numeric - 25569) * 86_400_000;
        const parsed = new Date(milliseconds);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeDate(value: Date | null): string | null {
    return value ? value.toISOString() : null;
}

function findNycHeaderRowIndex(grid: CsvGrid): number {
    return grid.findIndex(
        (row) => normalizeGridLabel(row[0] ?? '') === NYC_HEADER_MARKER,
    );
}

const NYC_BOROUGH_CODES = new Set(['1', '2', '3', '4', '5']);

function shouldKeepNycBoroughCode(args: {
    rowBoroughCode: string;
    targetBoroughCode: string;
}): boolean {
    if (!NYC_BOROUGH_CODES.has(args.rowBoroughCode)) {
        return false;
    }

    const target = normalizeGridLabel(args.targetBoroughCode).toLowerCase();
    if (target === '' || target === 'all' || target === '*') {
        return true;
    }

    return args.rowBoroughCode === normalizeGridLabel(args.targetBoroughCode);
}

function extractNycRollingSalesRecords(args: {
    grid: CsvGrid;
    boroughCode: string;
}): PipelineRecords {
    const headerRowIndex = findNycHeaderRowIndex(args.grid);
    if (headerRowIndex < 0) {
        return [];
    }

    const records: PipelineRecords = [];

    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < args.grid.length;
        rowIndex += 1
    ) {
        const row = args.grid[rowIndex] ?? [];
        const boroughCode = normalizeGridLabel(row[0] ?? '');
        if (
            !shouldKeepNycBoroughCode({
                rowBoroughCode: boroughCode,
                targetBoroughCode: args.boroughCode,
            })
        ) {
            continue;
        }

        const salePrice = parseNumericCell(String(row[19] ?? ''));
        if (salePrice === null || salePrice <= 0) {
            continue;
        }

        const saleDate = serializeDate(parseMaybeDate(row[20]));

        records.push({
            borough_code: boroughCode,
            neighborhood: normalizeGridLabel(row[1] ?? ''),
            property_type: normalizeGridLabel(row[2] ?? ''),
            block: parseNumericCell(row[4] ?? ''),
            lot: parseNumericCell(row[5] ?? ''),
            address: normalizeGridLabel(row[8] ?? ''),
            apartment_number: normalizeGridLabel(row[9] ?? ''),
            zip_code: normalizeGridLabel(String(row[10] ?? '')),
            sale_price: salePrice,
            sale_date: saleDate,
        });
    }

    return records;
}

function buildHpiPeriodLabel(args: { yr: string; period: string }): string {
    const month = Number.parseInt(args.period, 10);
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
        return `${args.yr}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
    }

    return `${args.yr}-Q${args.period}`;
}

function computeYoyChangePct(args: {
    currentIndex: number;
    priorIndex: number | null;
}): number | null {
    if (args.priorIndex === null || args.priorIndex <= 0) {
        return null;
    }

    return Number(
        (
            ((args.currentIndex - args.priorIndex) / args.priorIndex) *
            100
        ).toFixed(4),
    );
}

function extractFilteredFhfaHpiRecords(args: {
    grid: CsvGrid;
    placeName: string;
    filterYear: string;
}): PipelineRecords {
    if (args.grid.length === 0) {
        return [];
    }

    const priorYear = String(Number.parseInt(args.filterYear, 10) - 1);
    const [headerRow, ...dataRows] = args.grid;
    const headers = headerRow.map((header) => normalizeGridLabel(header));

    const filteredRows = dataRows
        .map((row) =>
            Object.fromEntries(
                headers.map((header, index) => [header, row[index] ?? '']),
            ),
        )
        .filter((row) => {
            const level = normalizeGridLabel(String(row.level ?? ''));
            const placeName = normalizeGridLabel(String(row.place_name ?? ''));
            const flavor = normalizeGridLabel(String(row.hpi_flavor ?? ''));
            const frequency = normalizeGridLabel(String(row.frequency ?? ''));
            const year = normalizeGridLabel(String(row.yr ?? ''));

            return (
                level === 'MSA' &&
                placeName === args.placeName &&
                flavor === 'purchase-only' &&
                (frequency === 'monthly' || frequency === 'quarterly') &&
                (year === args.filterYear || year === priorYear)
            );
        });

    const indexByYearPeriod = new Map<string, number>();
    filteredRows.forEach((row) => {
        const yr = normalizeGridLabel(String(row.yr ?? ''));
        const period = normalizeGridLabel(String(row.period ?? ''));
        const indexValue = parseNumericCell(String(row.index_nsa ?? ''));
        if (indexValue === null) {
            return;
        }

        indexByYearPeriod.set(`${yr}:${period}`, indexValue);
    });

    const records: PipelineRecords = [];

    for (const row of filteredRows) {
        const yr = normalizeGridLabel(String(row.yr ?? ''));
        if (yr !== args.filterYear) {
            continue;
        }

        const period = normalizeGridLabel(String(row.period ?? ''));
        const priceIndex = parseNumericCell(String(row.index_nsa ?? ''));
        if (priceIndex === null) {
            continue;
        }

        const priorYearKey = String(Number.parseInt(yr, 10) - 1);
        const priorIndex =
            indexByYearPeriod.get(`${priorYearKey}:${period}`) ?? null;
        const yoyChangePct = computeYoyChangePct({
            currentIndex: priceIndex,
            priorIndex,
        });

        records.push({
            period: buildHpiPeriodLabel({ yr, period }),
            region: normalizeGridLabel(String(row.place_name ?? '')),
            price_index: priceIndex,
            yoy_change_pct: yoyChangePct,
            country: 'US',
            region_id: 'US-NYC',
        });
    }

    return records;
}

const NYC_COUNTY_TO_BOROUGH: Record<string, string> = {
    BRONX: 'BRONX',
    KINGS: 'BROOKLYN',
    'NEW YORK': 'MANHATTAN',
    QUEENS: 'QUEENS',
    RICHMOND: 'STATEN_ISLAND',
};

const NYC_COUNTY_FIPS_TO_BOROUGH: Record<string, string> = {
    '005': 'BRONX',
    '047': 'BROOKLYN',
    '061': 'MANHATTAN',
    '081': 'QUEENS',
    '085': 'STATEN_ISLAND',
};

function ltvRangeFromValue(value: unknown): string {
    const ltv = parseNumericCell(toText(value));
    if (ltv === null) return 'Unknown';
    if (ltv <= 60) return '<=60%';
    if (ltv <= 70) return '60-70%';
    if (ltv <= 80) return '70-80%';
    if (ltv <= 90) return '80-90%';
    return '>90%';
}

function incomeLevelFromRatio(value: unknown): string {
    const ratio = parseNumericCell(toText(value));
    if (ratio === null) return 'Unknown';
    if (ratio < 0.8) return 'Low';
    if (ratio < 1) return 'Moderate';
    if (ratio < 1.2) return 'Middle';
    return 'High';
}

function extractNycCtfMortgageRecords(args: {
    grid: CsvGrid;
}): PipelineRecords {
    const [headerRow, ...dataRows] = args.grid;
    const headers = headerRow.map((header) => normalizeGridLabel(header));
    const records: PipelineRecords = [];

    for (const row of dataRows) {
        const source = Object.fromEntries(
            headers.map((header, index) => [header, row[index] ?? '']),
        );
        if (normalizeGridLabel(toText(source.state_fips)) !== '36') {
            continue;
        }
        const countyFips = normalizeGridLabel(toText(source.county_fips))
            .replace(/\D/g, '')
            .padStart(3, '0');
        const borough = NYC_COUNTY_FIPS_TO_BOROUGH[countyFips];
        if (!borough) {
            continue;
        }

        const purposeCode = normalizeGridLabel(toText(source.purpose_ctf));
        records.push({
            borough,
            purpose:
                purposeCode === '1'
                    ? 'Purchase'
                    : purposeCode === '2'
                      ? 'Refinance-NoCashOut'
                      : purposeCode === '7'
                        ? 'Refinance-CashOut'
                        : 'Unknown',
            ltv_range: ltvRangeFromValue(source.ltv),
            income_level: incomeLevelFromRatio(source.income_ratio),
            metro_area: 'Metro',
            country: 'US',
            region_id: 'US-NYC',
        });
    }

    return records;
}

function normalizeCountyName(value: unknown): string {
    return normalizeGridLabel(toText(value)).toUpperCase();
}

const HPI_CAGR_YEARS = 5;

type CountyHpiPoint = {
    year: number;
    hpi: number;
};

function computeHpiCagrPct(args: {
    startHpi: number;
    endHpi: number;
    periodYears: number;
}): number | null {
    if (
        args.startHpi <= 0 ||
        args.endHpi <= 0 ||
        args.periodYears < 1 ||
        !Number.isFinite(args.startHpi) ||
        !Number.isFinite(args.endHpi)
    ) {
        return null;
    }

    const ratio = args.endHpi / args.startHpi;
    if (ratio <= 0) {
        return null;
    }

    return (ratio ** (1 / args.periodYears) - 1) * 100;
}

/**
 * N-year CAGR from HPI levels.
 * End = preferred year when present, else latest year with HPI.
 * Start = HPI at endYear - N, or nearest earlier year with HPI.
 */
function summarizeCountyHpiCagr(args: {
    county: string;
    borough: string;
    points: CountyHpiPoint[];
    preferredYear: number;
}): PipelineRecord | null {
    if (args.points.length === 0) {
        return null;
    }

    const sorted = [...args.points].sort(
        (left, right) => left.year - right.year,
    );
    const preferred = sorted.find((point) => point.year === args.preferredYear);
    const end = preferred ?? sorted[sorted.length - 1];
    const targetStartYear = end.year - HPI_CAGR_YEARS;

    let start: CountyHpiPoint | null = null;
    for (const point of sorted) {
        if (point.year <= targetStartYear && point.year < end.year) {
            start = point;
        }
    }

    if (!start) {
        const inWindow = sorted.filter(
            (point) => point.year < end.year && point.year > targetStartYear,
        );
        if (inWindow.length > 0) {
            start = inWindow[0];
        } else {
            for (const point of sorted) {
                if (point.year < end.year) {
                    start = point;
                }
            }
        }
    }

    if (!start || start.year >= end.year) {
        return {
            county: args.county,
            borough: args.borough,
            year: String(end.year),
            price_index: end.hpi,
            hpi_cagr_pct: null,
            country: 'US',
            region_id: 'US-NYC',
        };
    }

    const periodYears = end.year - start.year;
    const hpiCagrPct = computeHpiCagrPct({
        startHpi: start.hpi,
        endHpi: end.hpi,
        periodYears,
    });

    return {
        county: args.county,
        borough: args.borough,
        year: String(end.year),
        price_index: end.hpi,
        hpi_cagr_pct:
            hpiCagrPct === null ? null : Math.round(hpiCagrPct * 100) / 100,
        country: 'US',
        region_id: 'US-NYC',
    };
}

function extractCountyHpiRecords(args: {
    grid: CsvGrid;
    filterYear: string;
}): PipelineRecords {
    const headerIndex = args.grid.findIndex(
        (row) => normalizeGridLabel(row[0] ?? '') === 'State',
    );
    if (headerIndex < 0) {
        return [];
    }

    const headers = args.grid[headerIndex].map((header) =>
        normalizeGridLabel(header),
    );
    const pointsByCounty = new Map<
        string,
        { borough: string; points: CountyHpiPoint[] }
    >();

    for (const row of args.grid.slice(headerIndex + 1)) {
        const source = Object.fromEntries(
            headers.map((header, index) => [header, row[index] ?? '']),
        );
        if (normalizeGridLabel(String(source.State ?? '')) !== 'NY') {
            continue;
        }

        const county = normalizeGridLabel(String(source.County ?? ''));
        const borough = NYC_COUNTY_TO_BOROUGH[normalizeCountyName(county)];
        const year = parseNumericCell(String(source.Year ?? ''));
        const hpi = parseNumericCell(String(source.HPI ?? ''));
        if (!borough || year === null || hpi === null) {
            continue;
        }

        const bucket = pointsByCounty.get(county) ?? {
            borough,
            points: [],
        };
        bucket.points.push({ year, hpi });
        pointsByCounty.set(county, bucket);
    }

    const preferredYear = Number.parseInt(args.filterYear, 10);
    const records: PipelineRecords = [];

    for (const [county, bucket] of pointsByCounty.entries()) {
        const summary = summarizeCountyHpiCagr({
            county,
            borough: bucket.borough,
            points: bucket.points,
            preferredYear: Number.isFinite(preferredYear)
                ? preferredYear
                : Number.parseInt(DEFAULT_US_HPI_FILTER_YEAR, 10),
        });
        if (summary) {
            records.push(summary);
        }
    }

    return records;
}

export const normalizeNycRollingSalesCsvDefinition = {
    function_name: 'normalize_nyc_rolling_sales_csv',
    function_description:
        'Normalize NYC rolling sales Excel CSV export into headered property sale rows.',
    function_attributes: [
        ...TEXT_INPUT,
        {
            attribute_name: 'borough_code',
            attribute_data_type: 'string',
            order: 2,
            required: false,
            default_value: 'all',
            default_quote_render: true,
        },
    ],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_nyc_rolling_sales_csv({
    text,
    borough_code = 'all',
}: {
    text: string;
    borough_code?: string;
}): string {
    const grid = parseCsvTextToGrid(text);
    const records = extractNycRollingSalesRecords({
        grid,
        boroughCode: borough_code,
    });

    return recordsToCsvText(records, [...NYC_SALE_COLUMNS]);
}

export const normalizeFhfaHpiCsvDefinition = {
    function_name: 'normalize_fhfa_hpi_csv',
    function_description:
        'Filter FHFA HPI CSV to NYC MSA purchase-only rows and compute YoY change.',
    function_attributes: [
        ...TEXT_INPUT,
        {
            attribute_name: 'place_name',
            attribute_data_type: 'string',
            order: 2,
            required: false,
            default_value: DEFAULT_US_HPI_PLACE_NAME,
            default_quote_render: true,
        },
        {
            attribute_name: 'filter_year',
            attribute_data_type: 'string',
            order: 3,
            required: false,
            default_value: DEFAULT_US_HPI_FILTER_YEAR,
            default_quote_render: true,
        },
    ],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_fhfa_hpi_csv(args: {
    text: string;
    place_name?: string;
    filter_year?: string;
}): string {
    const grid = parseCsvTextToGrid(args.text);
    const records = extractFilteredFhfaHpiRecords({
        grid,
        placeName: args.place_name ?? DEFAULT_US_HPI_PLACE_NAME,
        filterYear: args.filter_year ?? DEFAULT_US_HPI_FILTER_YEAR,
    });

    return recordsToCsvText(records, [
        'period',
        'region',
        'price_index',
        'yoy_change_pct',
        'country',
        'region_id',
    ]);
}

export const normalizeFhfaCountyHpiCsvDefinition = {
    function_name: 'normalize_fhfa_county_hpi_csv',
    function_description:
        'Normalize FHFA county HPI CSV to NYC borough rows with 5-year HPI CAGR.',
    function_attributes: [
        ...TEXT_INPUT,
        {
            attribute_name: 'filter_year',
            attribute_data_type: 'string',
            order: 2,
            required: false,
            default_value: DEFAULT_US_HPI_FILTER_YEAR,
            default_quote_render: true,
        },
    ],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_fhfa_county_hpi_csv(args: {
    text: string;
    filter_year?: string;
}): string {
    const records = extractCountyHpiRecords({
        grid: parseCsvTextToGrid(args.text),
        filterYear: args.filter_year ?? DEFAULT_US_HPI_FILTER_YEAR,
    });

    return recordsToCsvText(records, [
        'county',
        'borough',
        'year',
        'price_index',
        'hpi_cagr_pct',
        'country',
        'region_id',
    ]);
}

export const normalizeNycCtfMortgageCsvDefinition = {
    function_name: 'normalize_nyc_ctf_mortgage_csv',
    function_description:
        'Filter FHFA CTF mortgages to NYC counties and decode investment scoring fields.',
    function_attributes: [...TEXT_INPUT],
    function_returns: TEXT_RETURN,
    is_async: false,
} satisfies FunctionDefinition;

export function normalize_nyc_ctf_mortgage_csv(args: { text: string }): string {
    const records = extractNycCtfMortgageRecords({
        grid: parseCsvTextToGrid(args.text),
    });

    return recordsToCsvText(records, [
        'borough',
        'purpose',
        'ltv_range',
        'income_level',
        'metro_area',
        'country',
        'region_id',
    ]);
}

export const usDatasetNormalizeFunctionDefinitions = [
    normalizeNycRollingSalesCsvDefinition,
    normalizeFhfaHpiCsvDefinition,
    normalizeFhfaCountyHpiCsvDefinition,
    normalizeNycCtfMortgageCsvDefinition,
] satisfies FunctionDefinition[];
