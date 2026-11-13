import { getEntityWithName } from '@vyapti/core';
import type { DataSource } from 'typeorm';
import {
    PROCESS_ENTITY_NAMES,
    PROCESS_STATUS,
} from '@vulcan/shared/constants/process.constants';
import { readNumber } from '@vulcan/shared/utils/record-readers';

type ProcessStatusValue = (typeof PROCESS_STATUS)[keyof typeof PROCESS_STATUS];

type UpdateProcessStatusPayload = {
    process_id: number;
    status: ProcessStatusValue;
    process_result_json?: Record<string, unknown> | null;
    process_error_json?: Record<string, unknown> | null;
};

const updateProcessStatus = async (
    args: {
        dataSource: DataSource;
    } & UpdateProcessStatusPayload,
): Promise<void> => {
    const operationStatusEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.OPERATION_STATUS,
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
    const processStatusId = readNumber(operationStatus, 'operation_status_id');

    const processEntity = getEntityWithName(
        PROCESS_ENTITY_NAMES.PROCESS,
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
};

export {
    updateProcessStatus,
    type ProcessStatusValue,
    type UpdateProcessStatusPayload,
};
