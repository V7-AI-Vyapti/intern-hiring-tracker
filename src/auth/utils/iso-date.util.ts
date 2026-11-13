function toIsoDateString(value: Date): string {
    return value.toISOString();
}

function fromIsoDateString(value: string): Date {
    return new Date(value);
}

export { fromIsoDateString, toIsoDateString };
