import type { FunctionDefinition } from '../types.js';
import { parseHeaderedCsvTextToRecords } from './csv_text_utils.js';
import { split_lines_from_text } from './split_lines_from_text.js';

const EXTENSION_TO_FORMAT: Record<string, string> = {
    json: 'JSON',
    csv: 'CSV',
    tsv: 'TSV',
    txt: 'TXT',
};

const MIME_TYPE_TO_FORMAT: Record<string, string> = {
    'application/json': 'JSON',
    'text/csv': 'CSV',
    'text/tab-separated-values': 'TSV',
    'text/plain': 'TXT',
};

export const parseFileContentToRecordsDefinition = {
    function_name: 'parse_file_content_to_records',
    function_description:
        'Parse common text file content (JSON, CSV, TSV, TXT) into records for ingestion.',
    function_attributes: [
        {
            attribute_name: 'text',
            attribute_data_type: 'string',
            order: 1,
            required: true,
        },
        {
            attribute_name: 'file',
            attribute_data_type: 'object',
            order: 2,
            required: false,
            default_value: 'file',
            default_quote_render: false,
        },
        {
            attribute_name: 'fileMeta',
            attribute_data_type: 'object',
            order: 3,
            required: false,
            default_value: 'fileMeta',
            default_quote_render: false,
        },
        {
            attribute_name: 'fields',
            attribute_data_type: 'string[]',
            order: 4,
            required: false,
            default_value: null,
            default_quote_render: false,
        },
    ],
    function_returns: [
        {
            attribute_name: 'records',
            attribute_data_type: 'object[]',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

function normalizeMimeType(mimeType: string): string {
    return mimeType.trim().toLowerCase().split(';')[0]?.trim() ?? '';
}

function extractFileExtension(fileName: string): string | null {
    const trimmed = fileName.trim();
    const lastDotIndex = trimmed.lastIndexOf('.');

    if (lastDotIndex <= 0 || lastDotIndex === trimmed.length - 1) {
        return null;
    }

    return trimmed.slice(lastDotIndex + 1).toLowerCase();
}

function inferFormatFromFileName(fileName: string): string | null {
    if (!fileName.trim()) {
        return null;
    }

    const extension = extractFileExtension(fileName);

    if (!extension) {
        return null;
    }

    return EXTENSION_TO_FORMAT[extension] ?? null;
}

function inferFormatFromMimeType(mimeType: string): string | null {
    if (!mimeType.trim()) {
        return null;
    }

    const normalizedMimeType = normalizeMimeType(mimeType);

    return MIME_TYPE_TO_FORMAT[normalizedMimeType] ?? null;
}

function inferFormatFromContent(text: string): string {
    const trimmed = text.replace(/^\uFEFF/, '').trim();

    if (!trimmed) {
        return 'TXT';
    }

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return 'JSON';
    }

    const lines = split_lines_from_text({ text: trimmed });

    if (lines.length > 1) {
        if (lines[0]?.includes('\t')) {
            return 'TSV';
        }

        if (lines[0]?.includes(',')) {
            return 'CSV';
        }
    }

    return 'TXT';
}

function resolveFormat(args: {
    text: string;
    fileName: string;
    mimeType: string;
}): string {
    return (
        inferFormatFromFileName(args.fileName) ??
        inferFormatFromMimeType(args.mimeType) ??
        inferFormatFromContent(args.text)
    );
}

function parseJsonContent(text: string): Record<string, unknown>[] {
    const parsed: unknown = JSON.parse(text.replace(/^\uFEFF/, '').trim());

    if (Array.isArray(parsed)) {
        if (!parsed.every(isRecord)) {
            throw new Error(
                'parse_file_content_to_records JSON array must contain only objects',
            );
        }

        return parsed;
    }

    if (isRecord(parsed)) {
        return [parsed];
    }

    throw new Error(
        'parse_file_content_to_records JSON must be an object or array of objects',
    );
}

function parseDelimitedContent(args: {
    text: string;
    delimiter: string;
}): Record<string, unknown>[] {
    const lines = split_lines_from_text({ text: args.text });

    if (lines.length === 0) {
        return [];
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine
        .split(args.delimiter)
        .map((header) => header.trim())
        .filter(Boolean);

    if (headers.length === 0) {
        return [];
    }

    return dataLines.map((line) => {
        const values = line.split(args.delimiter).map((value) => value.trim());
        const record: Record<string, unknown> = {};

        headers.forEach((header, index) => {
            record[header] = values[index] ?? '';
        });

        return record;
    });
}

function parseTxtContent(text: string): Record<string, unknown>[] {
    return split_lines_from_text({ text }).map((line) => ({ line }));
}

function parseFieldsArg(value: unknown): string[] | undefined {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
        throw new Error(
            'parse_file_content_to_records fields must be a JSON array',
        );
    }

    return parsed.map(String);
}

export function parse_file_content_to_records({
    text,
    file,
    fileMeta,
    fields,
}: {
    text: string;
    file?: unknown;
    fileMeta?: unknown;
    fields?: string[] | string;
}): Record<string, unknown>[] {
    const fileRecord = toRecord(file);
    const fileMetaRecord = toRecord(fileMeta);
    const fileNameValue = fileRecord['file_name'];
    const fileName = typeof fileNameValue === 'string' ? fileNameValue : '';
    const mimeTypeValue = fileMetaRecord['mime_type'];
    const mimeType = typeof mimeTypeValue === 'string' ? mimeTypeValue : '';
    const format = resolveFormat({ text, fileName, mimeType });
    const selectedFields = parseFieldsArg(fields);

    switch (format) {
        case 'JSON':
            return parseJsonContent(text);
        case 'CSV':
            return parseHeaderedCsvTextToRecords(text, selectedFields);
        case 'TSV':
            return parseDelimitedContent({ text, delimiter: '\t' });
        case 'TXT':
            return parseTxtContent(text);
        default:
            return parseTxtContent(text);
    }
}
