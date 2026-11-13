function readNullableString(record: unknown, fieldName: string): string | null {
    if (!record || typeof record !== 'object') {
        return null;
    }

    const value = (record as Record<string, unknown>)[fieldName];
    if (value == null) {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return `${value}`;
    }
    return null;
}

export { readNullableString };
