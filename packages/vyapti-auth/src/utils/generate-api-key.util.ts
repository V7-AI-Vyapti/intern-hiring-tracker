import { randomBytes } from 'node:crypto';
import { AUTH_API_KEY } from '../auth.constants.js';

function generateApiKey(): { rawKey: string; prefix: string } {
    const prefix = randomBytes(AUTH_API_KEY.PREFIX_HEX_LENGTH / 2).toString(
        'hex',
    );
    const secret = randomBytes(AUTH_API_KEY.SECRET_BYTE_LENGTH).toString('hex');
    const rawKey = `${AUTH_API_KEY.PREFIX}_${prefix}_${secret}`;
    return { rawKey, prefix };
}

function readApiKeyPrefix(args: { rawKey: string }): string | null {
    const parts = args.rawKey.split('_');
    if (parts.length < 3 || parts[0] !== AUTH_API_KEY.PREFIX) {
        return null;
    }
    return parts[1] ?? null;
}

export { generateApiKey, readApiKeyPrefix };
