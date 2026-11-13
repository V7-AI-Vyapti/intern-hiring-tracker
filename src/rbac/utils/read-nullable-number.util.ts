function readNullableNumber(
    record: unknown,
    fieldName: string,
): number | null {
    if (!record || typeof record !== 'object') {
        return null;
    }
    const value = (record as Record<string, unknown>)[fieldName];
    if (value == null) {
        return null;
    }
    if (typeof value === 'object') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }
    return parsed;
}

export { readNullableNumber };
