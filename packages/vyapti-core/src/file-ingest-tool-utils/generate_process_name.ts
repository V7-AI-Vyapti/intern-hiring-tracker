export function generateProcessName(args: {
    processNamePrefix: string;
    fileId: number;
}): string {
    return `${args.processNamePrefix}_${String(args.fileId)}_${String(Date.now())}`;
}
