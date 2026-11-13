import type { DataSource } from 'typeorm';
import { getEntityWithName } from '../custom_entities/custom_typeorm_entities.js';
import { FILE_INGEST_PROCESS_ENTITY_NAMES } from './constants.js';
import { readNumber } from './read_number.js';
import type { CreateProcessEntityPayload } from './types.js';

export async function createProcessEntity(
    args: {
        dataSource: DataSource;
    } & CreateProcessEntityPayload,
): Promise<number> {
    const operationStatusEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.OPERATION_STATUS,
        args.dataSource,
    );
    const { entity: operationStatus } = await operationStatusEntity.getOrCreate(
        {
            where: {
                operation_status_name: args.process_status_name,
            },
            create: {
                operation_status_name: args.process_status_name,
                description: null,
            },
        },
    );
    const processStatusId = readNumber(
        operationStatus as unknown as Record<string, unknown>,
        'operation_status_id',
    );

    const toolTypeEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.TOOL_TYPE,
        args.dataSource,
    );
    const { entity: toolType } = await toolTypeEntity.getOrCreate({
        where: {
            tool_type_name: args.tool_type_name,
        },
        create: {
            tool_type_name: args.tool_type_name,
            description: null,
        },
    });
    const toolTypeId = readNumber(
        toolType as unknown as Record<string, unknown>,
        'tool_type_id',
    );

    const toolEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.TOOL,
        args.dataSource,
    );
    const { entity: tool } = await toolEntity.getOrCreate({
        where: {
            tool_name: args.tool_name,
        },
        create: {
            tool_name: args.tool_name,
            description: null,
            additional_json_data: null,
            tool_type_id: toolTypeId,
        },
    });
    const toolId = readNumber(
        tool as unknown as Record<string, unknown>,
        'tool_id',
    );

    const processEntity = getEntityWithName(
        FILE_INGEST_PROCESS_ENTITY_NAMES.PROCESS,
        args.dataSource,
    );
    const process = await processEntity.createOne({
        process_name: args.process_name,
        description: args.description ?? null,
        process_metadata: args.process_metadata ?? null,
        process_result_json: null,
        process_error_json: null,
        tool_id: toolId,
        process_status_id: processStatusId,
    });

    return readNumber(
        process as unknown as Record<string, unknown>,
        'process_id',
    );
}
