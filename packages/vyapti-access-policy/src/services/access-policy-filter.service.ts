import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    ACCESS_POLICY_MESSAGES,
    ACCESS_POLICY_MODES,
} from '../access-policy.constants.js';
import { ACCESS_POLICY_PERSISTENCE_ADAPTER } from '../access-policy.tokens.js';
import type {
    AccessFilter,
    AccessPolicyPersistenceAdapter,
} from '../types/access-policy.types.js';
import { readRowValue, uniqueSorted } from '../utils/policy-shape.util.js';
import { AccessPolicyCacheService } from './access-policy-cache.service.js';

type ResolveFilterArgs = {
    userId: string;
    entityName: string;
    isSystemAdmin: boolean;
};

@Injectable()
class AccessPolicyFilterService {
    constructor(
        @Inject(ACCESS_POLICY_PERSISTENCE_ADAPTER)
        private readonly persistence: AccessPolicyPersistenceAdapter,
        private readonly cache: AccessPolicyCacheService,
    ) {}

    async resolveFilter(args: ResolveFilterArgs): Promise<AccessFilter> {
        const cached = this.cache.get(args);
        if (cached) {
            return cached;
        }
        const result = await this.resolveUncached(args);
        this.cache.set({ ...args, result });
        return result;
    }

    async assertRow(args: ResolveFilterArgs & { row: object }): Promise<void> {
        const filter = await this.resolveFilter(args);
        if ('unrestricted' in filter) {
            return;
        }
        if ('deny' in filter) {
            throw new NotFoundException(ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND);
        }
        const value = readRowValue(args.row, filter.field);
        if (value === null || !filter.values.includes(value)) {
            throw new NotFoundException(ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND);
        }
    }

    private async resolveUncached(
        args: ResolveFilterArgs,
    ): Promise<AccessFilter> {
        if (args.isSystemAdmin) {
            return { unrestricted: true };
        }
        const policy = await this.persistence.findPolicy({
            entityName: args.entityName,
        });
        if (!policy || policy.mode === ACCESS_POLICY_MODES.UNRESTRICTED) {
            return { unrestricted: true };
        }
        if (policy.mode === ACCESS_POLICY_MODES.DENY) {
            return { deny: true };
        }
        return this.resolveMembershipFilter({
            userId: args.userId,
            constraintField: policy.constraintField,
            scopeKey: policy.scopeKey,
        });
    }

    private async resolveMembershipFilter(args: {
        userId: string;
        constraintField: string | null;
        scopeKey: string | null;
    }): Promise<AccessFilter> {
        if (!args.constraintField || !args.scopeKey) {
            return { deny: true };
        }
        const memberships = await this.persistence.listMemberships({
            userId: args.userId,
            scopeKey: args.scopeKey,
        });
        const values = uniqueSorted(
            memberships.rows.map(function readScopeId(row) {
                return row.scopeId;
            }),
        );
        return { field: args.constraintField, op: 'in', values };
    }
}

export { AccessPolicyFilterService };
