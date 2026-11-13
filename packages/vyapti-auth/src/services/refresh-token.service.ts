import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
    AUTH_MODULE_OPTIONS,
    AUTH_PERSISTENCE_ADAPTER,
} from '../auth.tokens.js';
import type {
    AuthPersistenceAdapter,
    ResolvedAuthModuleOptions,
    StoredRefreshToken,
} from '../types/auth.types.js';
import { hashToken } from '../utils/hash-token.util.js';

const REFRESH_TOKEN_BYTES = 32;

@Injectable()
class RefreshTokenService {
    constructor(
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
        @Inject(AUTH_PERSISTENCE_ADAPTER)
        private readonly persistence: AuthPersistenceAdapter,
    ) {}

    async issue(args: { userId: string }): Promise<string> {
        const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
        const expiresAt = new Date(
            Date.now() + this.options.jwt.refreshTtlSeconds * 1000,
        );
        await this.persistence.saveRefreshToken({
            userId: args.userId,
            hash: hashToken({ token: rawToken }),
            expiresAt,
        });
        return rawToken;
    }

    async consume(args: { rawToken: string }): Promise<StoredRefreshToken> {
        const hash = hashToken({ token: args.rawToken });
        const stored = await this.persistence.findRefreshTokenByHash({ hash });
        if (!stored || stored.expiresAt.getTime() <= Date.now()) {
            if (stored) {
                await this.persistence.deleteRefreshTokenByHash({ hash });
            }
            throw new Error('REFRESH_TOKEN_INVALID');
        }

        await this.persistence.deleteRefreshTokenByHash({ hash });
        return stored;
    }

    async revoke(args: { rawToken: string }): Promise<void> {
        await this.persistence.deleteRefreshTokenByHash({
            hash: hashToken({ token: args.rawToken }),
        });
    }
}

export { RefreshTokenService };
