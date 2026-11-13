import { getEntityWithName } from '@vyapti/core';
import type { DataSource } from 'typeorm';
import { PROCESS_ENTITY_NAMES } from '@vulcan/shared/constants/process.constants';
import { readNumber } from '@vulcan/shared/utils/record-readers';

type CreateProcessEntityPayload = {
    process_name: string;
    process_status_name: string;
    tool_type_name: string;
    tool_name: string;
    process_metadata?: Record<string, unknown> | null;
    description?: string | null;
};

const createProcessEntity = async (
    args: {
        dataSource: DataSource;
    } & CreateProcessEntityPayload,
): Promise<number> => {
    const operationStatusEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.OPERATION_STATUS,
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
    const processStatusId = readNumber(operationStatus, 'operation_status_id');

    const toolTypeEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.TOOL_TYPE,
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
    const toolTypeId = readNumber(toolType, 'tool_type_id');

    const toolEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.TOOL,
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
    const toolId = readNumber(tool, 'tool_id');

    const processEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.PROCESS,
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

    return readNumber(process, 'process_id');
};

export { createProcessEntity, type CreateProcessEntityPayload };
