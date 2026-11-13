import type { DataSource } from 'typeorm';
import type { ProcessStatusValue, UpdateProcessStatusFn } from './types.js';
import { updateProcessStatus } from './update_process_status.js';

export function bindUpdateProcessStatus(args: {
    dataSource: DataSource;
}): UpdateProcessStatusFn<ProcessStatusValue> {
    return (payload) =>
        updateProcessStatus({
            ...payload,
            dataSource: args.dataSource,
        });
}
