import type { DataSource } from 'typeorm';
import { getEntityWithName } from '../custom_entities/custom_typeorm_entities.js';
import { FILE_INGEST_PROCESS_ENTITY_NAMES } from './constants.js';
import { readNumber } from './read_number.js';
import type {
    ProcessStatusValue,
    UpdateProcessStatusPayload,
} from './types.js';

export async function updateProcessStatus(
    args: {
        dataSource: DataSource;
    } & UpdateProcessStatusPayload<ProcessStatusValue>,
): Promise<void> {
    const operationStatusEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.OPERATION_STATUS,
        args.dataSource,
    );
    const { entity: operationStatus } = await operationStatusEntity.getOrCreate(
        {
            where: {
                operation_status_name: args.status,
            },
            create: {
                operation_status_name: args.status,
                description: null,
            },
        },
    );
    const processStatusId = readNumber(
        operationStatus as unknown as Record<string, unknown>,
        'operation_status_id',
    );

    const processEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.PROCESS,
        args.dataSource,
    );
    await processEntity.updateByPk(args.process_id, {
        process_status_id: processStatusId,
        ...(Object.prototype.hasOwnProperty.call(args, 'process_result_json')
            ? { process_result_json: args.process_result_json }
            : {}),
        ...(Object.prototype.hasOwnProperty.call(args, 'process_error_json')
            ? { process_error_json: args.process_error_json }
            : {}),
    });
}
