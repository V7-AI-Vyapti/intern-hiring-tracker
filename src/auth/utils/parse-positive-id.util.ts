function parsePositiveId(value: string | number): number | null {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }
    return parsed;
}

export { parsePositiveId };
