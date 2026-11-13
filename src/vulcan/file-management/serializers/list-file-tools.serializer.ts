import { FileToolListResponseDto } from '@file-management/schema/file-tool.schema/file-tool-list-response.schema';
import {
    FileToolResponseDto,
    FileToolResponseSchema,
} from '@file-management/schema/file-tool.schema/file-tool-response.schema';
import {
    readDescription,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';

function readJsonObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}

function readNullableJsonObject(
    value: unknown,
): Record<string, unknown> | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function readNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function serializeFileToolRow(row: unknown): FileToolResponseDto {
    const record = row as Record<string, unknown>;
    const parsed = FileToolResponseSchema.parse({
        availableToolId: readNumber(row, 'available_tool_id'),
        configuredToolName: readString(row, 'configured_tool_name'),
        description: readDescription(record.description),
        toolTypeName: readString(row, 'tool_type_name'),
        apiEndpoint: readNullableJsonObject(record.api_endpoint),
        targetEntityName: readNullableString(record.target_entity_name),
        additionalJsonData: readJsonObject(record.additional_json_data),
    });

    return Object.assign(new FileToolResponseDto(), parsed);
}

function serializeFileToolList(rows: unknown[]): FileToolResponseDto[] {
    return rows.map(serializeFileToolRow);
}

function buildFileToolListResponse(
    items: FileToolResponseDto[],
): FileToolListResponseDto {
    const response = new FileToolListResponseDto();
    response.items = items;
    return response;
}

export {
    buildFileToolListResponse,
    serializeFileToolList,
    serializeFileToolRow,
};
