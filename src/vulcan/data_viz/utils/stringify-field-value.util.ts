function stringifyFieldValue(value: unknown, fallback = 'null'): string {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'string') {
        return value;
    }

    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    }

    return fallback;
}

export { stringifyFieldValue };
