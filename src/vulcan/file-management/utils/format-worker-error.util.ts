const formatWorkerError = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export { formatWorkerError };
