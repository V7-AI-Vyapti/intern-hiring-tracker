export type CsvGrid = string[][];

export function parseCsvTextToGrid(text: string): CsvGrid {
    const normalized = text.replace(/^\uFEFF/, '');
    const grid: CsvGrid = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < normalized.length; index += 1) {
        const character = normalized[index];

        if (inQuotes) {
            if (character === '"') {
                if (normalized[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += character;
            }
            continue;
        }

        if (character === '"') {
            inQuotes = true;
            continue;
        }

        if (character === ',') {
            row.push(cell);
            cell = '';
            continue;
        }

        if (character === '\n' || character === '\r') {
            if (character === '\r' && normalized[index + 1] === '\n') {
                index += 1;
            }
            row.push(cell);
            grid.push(row);
            row = [];
            cell = '';
            continue;
        }

        cell += character;
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        grid.push(row);
    }

    return grid;
}

function resolveCsvFieldIndexes(
    headers: string[],
    fields: readonly string[],
): Array<{ header: string; index: number }> {
    const headerIndexByName = new Map(
        headers.map((header, index) => [header, index]),
    );

    return fields.map((field) => {
        const index = headerIndexByName.get(field);
        if (index === undefined) {
            throw new Error(`CSV header not found: ${field}`);
        }

        return { header: field, index };
    });
}

function parseProjectedCsvTextToRecords(
    text: string,
    fields: readonly string[],
): Record<string, unknown>[] {
    const normalized = text.replace(/^\uFEFF/, '');
    const records: Record<string, unknown>[] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    let selectedFields: Array<{ header: string; index: number }> | null = null;

    const finalizeRow = (): void => {
        if (selectedFields === null) {
            const headers = row.map((header) => header.trim()).filter(Boolean);
            if (headers.length === 0) {
                row = [];
                cell = '';
                return;
            }

            selectedFields = resolveCsvFieldIndexes(headers, fields);
            row = [];
            cell = '';
            return;
        }

        if (row.some((value) => value.trim())) {
            const record: Record<string, unknown> = {};
            selectedFields.forEach(({ header, index }) => {
                const value = row[index] ?? '';
                record[header] = value === '' ? null : value;
            });
            records.push(record);
        }

        row = [];
        cell = '';
    };

    for (let index = 0; index < normalized.length; index += 1) {
        const character = normalized[index];

        if (inQuotes) {
            if (character === '"') {
                if (normalized[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += character;
            }
            continue;
        }

        if (character === '"') {
            inQuotes = true;
            continue;
        }

        if (character === ',') {
            row.push(cell);
            cell = '';
            continue;
        }

        if (character === '\n' || character === '\r') {
            if (character === '\r' && normalized[index + 1] === '\n') {
                index += 1;
            }
            row.push(cell);
            finalizeRow();
            continue;
        }

        cell += character;
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        finalizeRow();
    }

    return records;
}

export function parseHeaderedCsvTextToRecords(
    text: string,
    fields?: readonly string[],
): Record<string, unknown>[] {
    if (fields && fields.length > 0) {
        return parseProjectedCsvTextToRecords(text, fields);
    }

    const grid = parseCsvTextToGrid(text);

    if (grid.length === 0) {
        return [];
    }

    const [headerRow, ...dataRows] = grid;
    const headers = headerRow.map((header) => header.trim()).filter(Boolean);

    if (headers.length === 0) {
        return [];
    }

    const selectedFields = headers.map((header, index) => ({ header, index }));

    return dataRows
        .filter((row) => row.some((cell) => cell.trim()))
        .map((row) => {
            const record: Record<string, unknown> = {};

            selectedFields.forEach(({ header, index }) => {
                const value = row[index] ?? '';
                record[header] = value === '' ? null : value;
            });

            return record;
        });
}
