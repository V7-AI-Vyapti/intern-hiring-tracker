const TTL_PATTERN = /^(\d+)([smhd])$/;

const UNIT_SECONDS = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
} as const;

function parseTtlToSeconds(ttl: string): number {
    const trimmed = ttl.trim();
    const match = TTL_PATTERN.exec(trimmed);
    if (!match) {
        throw new Error(
            `Invalid auth TTL '${ttl}'. Use a value like 15m, 7d, or 900s.`,
        );
    }

    const amount = Number(match[1]);
    const unit = match[2] as keyof typeof UNIT_SECONDS;
    return amount * UNIT_SECONDS[unit];
}

export { parseTtlToSeconds };
