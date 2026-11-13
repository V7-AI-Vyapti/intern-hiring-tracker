export function generateEntityIngestProcessName(args: {
    processNamePrefix: string;
    sourceEntityName: string;
}): string {
    return `${args.processNamePrefix}_${args.sourceEntityName}_${String(Date.now())}`;
}
