import { Inject, Injectable } from '@nestjs/common';
import { RBAC_MODULE_OPTIONS } from '../rbac.tokens.js';
import type {
    Grant,
    RbacContext,
    ResolvedRbacModuleOptions,
} from '../types/rbac.types.js';

type CacheEntry = {
    allowed: boolean;
    expiresAt: number;
};

@Injectable()
class PermissionCacheService {
    private readonly entries = new Map<string, CacheEntry>();

    constructor(
        @Inject(RBAC_MODULE_OPTIONS)
        private readonly options: ResolvedRbacModuleOptions,
    ) {}

    get(args: {
        userId: string;
        context?: RbacContext;
        grant: Grant;
    }): boolean | undefined {
        const key = this.buildKey(args);
        const entry = this.entries.get(key);

        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }

        return entry.allowed;
    }

    set(args: {
        userId: string;
        context?: RbacContext;
        grant: Grant;
        allowed: boolean;
    }): void {
        this.entries.set(this.buildKey(args), {
            allowed: args.allowed,
            expiresAt: Date.now() + this.options.cacheTtlMs,
        });
    }

    clear(): void {
        this.entries.clear();
    }

    private buildKey(args: {
        userId: string;
        context?: RbacContext;
        grant: Grant;
    }): string {
        return [
            args.userId,
            serializeContext(args.context),
            args.grant.resource,
            args.grant.action,
        ].join('|');
    }
}

function serializeContext(context?: RbacContext): string {
    if (!context) {
        return '';
    }

    const orderedContext: RbacContext = {};
    for (const key of Object.keys(context).sort()) {
        orderedContext[key] = context[key];
    }
    return JSON.stringify(orderedContext);
}

export { PermissionCacheService };
