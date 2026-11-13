import { Inject, Injectable } from '@nestjs/common';
import { ACCESS_POLICY_MODULE_OPTIONS } from '../access-policy.tokens.js';
import type {
    AccessFilter,
    ResolvedAccessPolicyModuleOptions,
} from '../types/access-policy.types.js';

type CacheKey = {
    userId: string;
    entityName: string;
    isSystemAdmin: boolean;
};

type CacheEntry = {
    result: AccessFilter;
    expiresAt: number;
};

@Injectable()
class AccessPolicyCacheService {
    private readonly entries = new Map<string, CacheEntry>();

    constructor(
        @Inject(ACCESS_POLICY_MODULE_OPTIONS)
        private readonly options: ResolvedAccessPolicyModuleOptions,
    ) {}

    get(args: CacheKey): AccessFilter | undefined {
        const key = this.buildKey(args);
        const entry = this.entries.get(key);
        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return entry.result;
    }

    set(args: CacheKey & { result: AccessFilter }): void {
        this.entries.set(this.buildKey(args), {
            result: args.result,
            expiresAt: Date.now() + this.options.cacheTtlMs,
        });
    }

    clear(): void {
        this.entries.clear();
    }

    private buildKey(args: CacheKey): string {
        return [args.userId, args.entityName, String(args.isSystemAdmin)].join(
            '|',
        );
    }
}

export { AccessPolicyCacheService };
