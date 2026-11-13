import { Injectable } from '@nestjs/common';
import type { Grant, RbacContext } from '../types/rbac.types.js';
import { grantsInclude } from '../utils/grants.util.js';
import { EffectiveGrantsService } from './effective-grants.service.js';
import { PermissionCacheService } from './permission-cache.service.js';

@Injectable()
class PermissionCheckService {
    constructor(
        private readonly effectiveGrants: EffectiveGrantsService,
        private readonly cache: PermissionCacheService,
    ) {}

    async isAllowed(args: {
        userId: string;
        context?: RbacContext;
        grant: Grant;
    }): Promise<boolean> {
        const cached = this.cache.get(args);
        if (cached !== undefined) {
            return cached;
        }

        const access = await this.effectiveGrants.forUser({
            userId: args.userId,
            context: args.context,
        });
        const allowed =
            access.fullAccess || grantsInclude(access.grants, args.grant);
        this.cache.set({ ...args, allowed });
        return allowed;
    }
}

export { PermissionCheckService };
