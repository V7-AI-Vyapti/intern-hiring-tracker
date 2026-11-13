import type {
    ProcessStatusValue,
    UpdateProcessStatusFn,
} from '../file-ingest-tool-utils/types.js';
import type {
    EntityIngestProcessStatusJob,
    EntityIngestProcessStatusTask,
    EntityIngestProcessTrackedJobData,
} from './types.js';

export async function runWithEntityIngestProcessStatus<
    TJobData extends EntityIngestProcessTrackedJobData,
    TStatus extends string = ProcessStatusValue,
>(args: {
    job: EntityIngestProcessStatusJob<TJobData>;
    task: EntityIngestProcessStatusTask<TJobData>;
    updateProcessStatus: UpdateProcessStatusFn<TStatus>;
    runningStatus: TStatus;
    successStatus: TStatus;
    failedStatus: TStatus;
}): Promise<void> {
    const { process_id: processId, source_entity_name: sourceEntityName } =
        args.job.data;

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
                source_entity_name: sourceEntityName,
                message: error instanceof Error ? error.message : String(error),
            },
        });
        throw error;
    }
}
