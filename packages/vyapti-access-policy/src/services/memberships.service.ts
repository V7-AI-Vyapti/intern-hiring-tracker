import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ACCESS_POLICY_MESSAGES } from '../access-policy.constants.js';
import { ACCESS_POLICY_PERSISTENCE_ADAPTER } from '../access-policy.tokens.js';
import type {
    AccessPolicyPersistenceAdapter,
    MembershipRecord,
    MembershipWriteInput,
} from '../types/access-policy.types.js';
import { AccessPolicyCacheService } from './access-policy-cache.service.js';

type MembershipPage = {
    page: number;
    limit: number;
    search: string | null;
    userId: string | null;
    scopeKey: string | null;
    sortBy: 'scope_key' | 'scope_id';
    sortOrder: 'ASC' | 'DESC';
};

@Injectable()
class MembershipsService {
    constructor(
        @Inject(ACCESS_POLICY_PERSISTENCE_ADAPTER)
        private readonly persistence: AccessPolicyPersistenceAdapter,
        private readonly cache: AccessPolicyCacheService,
    ) {}

    async list(args: MembershipPage): Promise<{
        rows: MembershipRecord[];
        total: number;
        page: number;
        limit: number;
    }> {
        const result = await this.persistence.listMemberships({
            userId: args.userId,
            scopeKey: args.scopeKey,
            search: args.search,
            skip: (args.page - 1) * args.limit,
            take: args.limit,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
        });
        return { ...result, page: args.page, limit: args.limit };
    }

    async create(args: MembershipWriteInput): Promise<MembershipRecord> {
        await this.assertAvailable(args);
        const membership = await this.persistence.createMembership({
            input: args,
        });
        this.cache.clear();
        return membership;
    }

    async createMany(args: {
        userId: string;
        scopeKey: string;
        scopeIds: string[];
    }): Promise<MembershipRecord[]> {
        const inputs = this.uniqueInputs(args);
        for (const input of inputs) {
            await this.assertAvailable(input);
        }
        const memberships = await this.persistence.createMemberships({
            inputs,
        });
        this.cache.clear();
        return memberships;
    }

    async delete(args: { membershipId: string }): Promise<void> {
        const deleted = await this.persistence.deleteMembership(args);
        if (!deleted) {
            throw new NotFoundException(
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_NOT_FOUND,
            );
        }
        this.cache.clear();
    }

    private uniqueInputs(args: {
        userId: string;
        scopeKey: string;
        scopeIds: string[];
    }): MembershipWriteInput[] {
        const seen = new Set<string>();
        const inputs: MembershipWriteInput[] = [];
        for (const scopeId of args.scopeIds) {
            if (seen.has(scopeId)) {
                throw new BadRequestException(
                    ACCESS_POLICY_MESSAGES.DUPLICATE_SCOPE_IDS,
                );
            }
            seen.add(scopeId);
            inputs.push({
                userId: args.userId,
                scopeKey: args.scopeKey,
                scopeId,
            });
        }
        return inputs;
    }

    private async assertAvailable(args: MembershipWriteInput): Promise<void> {
        const existing = await this.persistence.findMembership(args);
        if (existing) {
            throw new ConflictException(
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_TAKEN,
            );
        }
    }
}

export { MembershipsService };
