import { BadRequestException } from '@nestjs/common';

export function parseIntIdOrThrow(label: string, raw: string): number {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || String(n) !== raw.trim()) {
        throw new BadRequestException(`Invalid ${label}`);
    }
    return n;
}
