import type {
    ProcessStatusJob,
    ProcessStatusTask,
    ProcessTrackedJobData,
    UpdateProcessStatusFn,
} from './types.js';

export async function runWithProcessStatus<
    TJobData extends ProcessTrackedJobData,
    TStatus extends string = string,
>(args: {
    job: ProcessStatusJob<TJobData>;
    task: ProcessStatusTask<TJobData>;
    updateProcessStatus: UpdateProcessStatusFn<TStatus>;
    runningStatus: TStatus;
    successStatus: TStatus;
    failedStatus: TStatus;
}): Promise<void> {
    const { process_id: processId, file_id: fileId } = args.job.data;

    await args.updateProcessStatus({
        process_id: processId,
        status: args.runningStatus,
    });

    try {
        const result = await args.task(args.job);

        await args.updateProcessStatus({
            process_id: processId,
            status: args.successStatus,
            process_result_json: result,
        });
    } catch (error: unknown) {
        await args.updateProcessStatus({
            process_id: processId,
            status: args.failedStatus,
            process_error_json: {
                ...(fileId !== undefined ? { file_id: fileId } : {}),
                message: error instanceof Error ? error.message : String(error),
            },
        });
        throw error;
    }
}
