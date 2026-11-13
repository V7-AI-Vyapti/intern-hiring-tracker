export const FILE_INGEST_DEFAULT_ENTITY_NAMES = {
    FILE: 'file',
    FILE_META_DATA: 'file_meta_data',
} as const;

export const FILE_INGEST_PROCESS_ENTITY_NAMES = {
    OPERATION_STATUS: 'operation_status',
    PROCESS: 'process',
    TOOL: 'tool',
    TOOL_TYPE: 'tool_type',
} as const;

export const PROCESS_STATUS = {
    SUCCESS: 'success',
    FAILED: 'failed',
    QUEUED: 'queued',
    RUNNING: 'running',
} as const;
