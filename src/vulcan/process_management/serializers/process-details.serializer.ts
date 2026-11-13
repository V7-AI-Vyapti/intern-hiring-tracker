import type { Process } from '@process-management/entities/process.entity';
import {
    readForeignKeyId,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';
import {
    ProcessDetailsSchema,
    type ProcessDetailsItem,
} from '@process-management/schema/process-details.schema';
import { readDescription } from '@vulcan/shared/utils/record-readers';

export const serializeProcessDetails = (row: Process): ProcessDetailsItem => {
    const rec = row as unknown as Record<string, unknown>;
    const processStatus = rec['process_status_id'] as
        | Record<string, unknown>
        | undefined;

    return ProcessDetailsSchema.parse({
        process_id: readNumber(row, 'process_id'),
        process_name: readString(row, 'process_name'),
        description: readDescription(rec['description']),
        process_metadata: rec['process_metadata'] ?? null,
        process_result_json: rec['process_result_json'] ?? null,
        process_error_json: rec['process_error_json'] ?? null,
        tool_id: readForeignKeyId(row, 'tool_id', 'tool_id'),
        process_status_id: readForeignKeyId(
            row,
            'process_status_id',
            'operation_status_id',
        ),
        process_status_name:
            (processStatus?.['operation_status_name'] as string | undefined) ??
            null,
    });
};
