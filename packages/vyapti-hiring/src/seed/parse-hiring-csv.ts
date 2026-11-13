type HiringCsvRow = Record<string, string>;

const splitCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
};

const parseHiringCsv = (text: string): HiringCsvRow[] => {
    const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    if (lines.length === 0) {
        return [];
    }
    const headers = splitCsvLine(lines[0]).map((header) => header.trim());
    return lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const row: HiringCsvRow = {};
        headers.forEach((header, index) => {
            row[header] = (values[index] ?? '').trim();
        });
        return row;
    });
};

export { parseHiringCsv, splitCsvLine };
export type { HiringCsvRow };
