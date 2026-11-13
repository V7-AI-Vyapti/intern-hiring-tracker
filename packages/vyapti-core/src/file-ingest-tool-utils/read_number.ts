export function readNumber(
    record: Record<string, unknown>,
    key: string,
): number {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    throw new Error(`Expected numeric ${key}`);
}
