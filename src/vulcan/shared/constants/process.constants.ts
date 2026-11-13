const PROCESS_STATUS = {
    SUCCESS: 'success',
    FAILED: 'failed',
    QUEUED: 'queued',
    RUNNING: 'running',
} as const;

const PROCESS_ENTITY_NAMES = {
    OPERATION_STATUS: 'operation_status',
    PROCESS: 'process',
    TOOL: 'tool',
    TOOL_TYPE: 'tool_type',
} as const;

export { PROCESS_ENTITY_NAMES, PROCESS_STATUS };
