type BackgroundQueueDefinition<TJobData extends Record<string, unknown>> = {
    configKey: string;
    queueName: string;
    jobName: string;
    __jobData?: TJobData;
};

type BackgroundJobEnqueueResponse = {
    job_id: string;
    status: 'queued';
};

export type { BackgroundQueueDefinition, BackgroundJobEnqueueResponse };
