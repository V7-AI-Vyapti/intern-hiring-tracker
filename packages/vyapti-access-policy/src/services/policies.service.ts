import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ACCESS_POLICY_MESSAGES } from '../access-policy.constants.js';
import { ACCESS_POLICY_PERSISTENCE_ADAPTER } from '../access-policy.tokens.js';
import type {
    AccessPolicyMode,
    AccessPolicyPersistenceAdapter,
    PolicyRecord,
} from '../types/access-policy.types.js';
import {
    assertFilterConstraint,
    blankToNull,
} from '../utils/policy-shape.util.js';
import { AccessPolicyCacheService } from './access-policy-cache.service.js';

type PolicyPage = {
    page: number;
    limit: number;
    search: string | null;
    sortBy: 'entity_name';
    sortOrder: 'ASC' | 'DESC';
};

@Injectable()
class PoliciesService {
    constructor(
        @Inject(ACCESS_POLICY_PERSISTENCE_ADAPTER)
        private readonly persistence: AccessPolicyPersistenceAdapter,
        private readonly cache: AccessPolicyCacheService,
    ) {}

    async list(args: PolicyPage): Promise<{
        rows: PolicyRecord[];
        total: number;
        page: number;
        limit: number;
    }> {
        const result = await this.persistence.listPolicies({
            search: args.search,
            skip: (args.page - 1) * args.limit,
            take: args.limit,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
        });
        return { ...result, page: args.page, limit: args.limit };
    }

    async create(args: {
        entityName: string;
        mode: AccessPolicyMode;
        constraintField?: string | null;
        scopeKey?: string | null;
    }): Promise<PolicyRecord> {
        const input = {
            entityName: args.entityName,
            mode: args.mode,
            constraintField: blankToNull(args.constraintField),
            scopeKey: blankToNull(args.scopeKey),
        };
        assertFilterConstraint(input);
        const existing = await this.persistence.findPolicy({
            entityName: input.entityName,
        });
        if (existing) {
            throw new ConflictException(
                ACCESS_POLICY_MESSAGES.POLICY_ENTITY_TAKEN,
            );
        }
        const policy = await this.persistence.createPolicy({ input });
        this.cache.clear();
        return policy;
    }

    async get(args: { policyId: string }): Promise<PolicyRecord> {
        return this.requirePolicy(args.policyId);
    }

    async update(args: {
        policyId: string;
        mode?: AccessPolicyMode;
        constraintField?: string | null;
        scopeKey?: string | null;
    }): Promise<PolicyRecord> {
        const current = await this.requirePolicy(args.policyId);
        const next = {
            mode: args.mode ?? current.mode,
            constraintField:
                args.constraintField === undefined
                    ? current.constraintField
                    : blankToNull(args.constraintField),
            scopeKey:
                args.scopeKey === undefined
                    ? current.scopeKey
                    : blankToNull(args.scopeKey),
        };
        assertFilterConstraint(next);
        const policy = await this.persistence.updatePolicy({
            policyId: args.policyId,
            input: next,
        });
        if (!policy) {
            throw new NotFoundException(
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
            );
        }
        this.cache.clear();
        return policy;
    }

    async delete(args: { policyId: string }): Promise<void> {
        await this.requirePolicy(args.policyId);
        const deleted = await this.persistence.deletePolicy(args);
        if (!deleted) {
            throw new NotFoundException(
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
            );
        }
        this.cache.clear();
    }

    private async requirePolicy(policyId: string): Promise<PolicyRecord> {
        const policy = await this.persistence.findPolicyById({ policyId });
        if (!policy) {
            throw new NotFoundException(
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
            );
        }
        return policy;
    }
}

export { PoliciesService };
