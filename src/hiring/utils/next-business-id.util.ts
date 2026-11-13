/**
 * Derive the next business id from existing id strings (e.g. CAN-0001 → CAN-0002).
 */
const nextBusinessId = (args: {
    existingIds: readonly string[];
    prefix: string;
    pad: number;
}): string => {
    const pattern = new RegExp(`^${args.prefix}-(\\d+)$`);
    let max = 0;
    for (const id of args.existingIds) {
        const match = pattern.exec(id);
        if (!match) {
            continue;
        }
        const value = Number(match[1]);
        if (Number.isFinite(value) && value > max) {
            max = value;
        }
    }
    return `${args.prefix}-${String(max + 1).padStart(args.pad, '0')}`;
};

export { nextBusinessId };
