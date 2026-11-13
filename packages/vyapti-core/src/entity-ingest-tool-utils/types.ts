export type EntityIngestProcessTrackedJobData = {
    process_id: number;
    source_entity_name: string;
    limit?: number;
};

export type EntityIngestProcessStatusJob<
    TJobData extends EntityIngestProcessTrackedJobData,
> = {
    data: TJobData;
};

export type EntityIngestProcessStatusTask<
    TJobData extends EntityIngestProcessTrackedJobData,
> = (
    job: EntityIngestProcessStatusJob<TJobData>,
) => Promise<Record<string, unknown>>;
