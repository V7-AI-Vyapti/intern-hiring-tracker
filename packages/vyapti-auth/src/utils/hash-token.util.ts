import { createHash, timingSafeEqual } from 'node:crypto';

function hashToken(args: { token: string }): string {
    return createHash('sha256').update(args.token).digest('hex');
}

function tokenMatchesHash(args: { token: string; hash: string }): boolean {
    const actual = hashToken({ token: args.token });
    const actualBuffer = Buffer.from(actual, 'hex');
    const expectedBuffer = Buffer.from(args.hash, 'hex');
    return (
        actualBuffer.length === expectedBuffer.length &&
        timingSafeEqual(actualBuffer, expectedBuffer)
    );
}

export { hashToken, tokenMatchesHash };
