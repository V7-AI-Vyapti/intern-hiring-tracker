import type { PROCESS_STATUS } from './constants.js';

export type ProcessTrackedJobData = {
    process_id: number;
    file_id?: number;
};

export type ProcessStatusJob<TJobData extends ProcessTrackedJobData> = {
    data: TJobData;
};

export type ProcessStatusTask<TJobData extends ProcessTrackedJobData> = (
    job: ProcessStatusJob<TJobData>,
) => Promise<Record<string, unknown>>;

export type UpdateProcessStatusPayload<TStatus extends string = string> = {
    process_id: number;
    status: TStatus;
    process_result_json?: Record<string, unknown> | null;
    process_error_json?: Record<string, unknown> | null;
};

export type UpdateProcessStatusFn<TStatus extends string = string> = (
    args: UpdateProcessStatusPayload<TStatus>,
) => Promise<void>;

export type ProcessStatusValue =
    (typeof PROCESS_STATUS)[keyof typeof PROCESS_STATUS];

export type CreateProcessEntityPayload = {
    process_name: string;
    process_status_name: string;
    tool_type_name: string;
    tool_name: string;
    process_metadata?: Record<string, unknown> | null;
    description?: string | null;
};
