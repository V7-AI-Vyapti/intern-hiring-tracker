import {
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AUTH_LIST_DEFAULTS, AUTH_MESSAGES } from '../auth.constants.js';
import {
    AUTH_MODULE_OPTIONS,
    AUTH_PERSISTENCE_ADAPTER,
} from '../auth.tokens.js';
import type {
    ApiKeyListRecord,
    AuthPersistenceAdapter,
    AuthUserPrincipal,
    ResolvedAuthModuleOptions,
} from '../types/auth.types.js';
import { hasApiKeyStrategy } from '../utils/auth-strategy.util.js';
import {
    generateApiKey,
    readApiKeyPrefix,
} from '../utils/generate-api-key.util.js';
import { hashToken, tokenMatchesHash } from '../utils/hash-token.util.js';

type IssueApiKeyResult = {
    id: string;
    prefix: string;
    name: string | null;
    createdAt: Date;
    rawKey: string;
};

type ListApiKeysResult = {
    rows: ApiKeyListRecord[];
    total: number;
    page: number;
    limit: number;
};

@Injectable()
class ApiKeyService {
    constructor(
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
        @Inject(AUTH_PERSISTENCE_ADAPTER)
        private readonly persistence: AuthPersistenceAdapter,
    ) {}

    assertEnabled(): void {
        if (!hasApiKeyStrategy(this.options.strategies)) {
            throw new NotFoundException(AUTH_MESSAGES.API_KEY_AUTH_DISABLED);
        }
    }

    async issue(args: {
        userId: string;
        name?: string | null;
    }): Promise<IssueApiKeyResult> {
        this.assertEnabled();
        const { rawKey, prefix } = generateApiKey();
        const created = await this.persistence.createApiKey({
            userId: args.userId,
            name: args.name?.trim() ? args.name.trim() : null,
            prefix,
            hash: hashToken({ token: rawKey }),
        });

        return {
            id: String(created.id),
            prefix: created.prefix,
            name: created.name,
            createdAt: created.createdAt,
            rawKey,
        };
    }

    async list(args: {
        userId: string;
        page?: number;
        limit?: number;
        search?: string | null;
        sortBy?: 'created_at' | 'name';
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<ListApiKeysResult> {
        this.assertEnabled();
        const page = args.page ?? AUTH_LIST_DEFAULTS.PAGE;
        const limit = Math.min(
            args.limit ?? AUTH_LIST_DEFAULTS.LIMIT,
            AUTH_LIST_DEFAULTS.MAX_LIMIT,
        );
        const search = args.search?.trim() ? args.search.trim() : null;
        const result = await this.persistence.listApiKeys({
            userId: args.userId,
            search,
            skip: (page - 1) * limit,
            take: limit,
            sortBy: args.sortBy ?? AUTH_LIST_DEFAULTS.SORT_BY,
            sortOrder: args.sortOrder ?? AUTH_LIST_DEFAULTS.SORT_ORDER,
        });

        return {
            rows: result.rows,
            total: result.total,
            page,
            limit,
        };
    }

    async revoke(args: { userId: string; apiKeyId: string }): Promise<void> {
        this.assertEnabled();
        const revoked = await this.persistence.revokeApiKey({
            userId: args.userId,
            apiKeyId: args.apiKeyId,
        });
        if (!revoked) {
            throw new NotFoundException(AUTH_MESSAGES.API_KEY_NOT_FOUND);
        }
    }

    async authenticate(args: { rawKey: string }): Promise<AuthUserPrincipal> {
        this.assertEnabled();
        const prefix = readApiKeyPrefix({ rawKey: args.rawKey });
        if (!prefix) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }

        const stored = await this.persistence.findApiKeyByPrefix({ prefix });
        if (
            !stored ||
            stored.revokedAt ||
            !tokenMatchesHash({ token: args.rawKey, hash: stored.hash })
        ) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }

        const user = await this.persistence.findUserById({
            userId: String(stored.userId),
        });
        if (!user || !user.isActive) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }

        return {
            id: String(user.id),
            email: user.email,
            displayName: user.displayName,
            authMethod: 'api-key',
        };
    }
}

export { ApiKeyService };
export type { IssueApiKeyResult, ListApiKeysResult };
