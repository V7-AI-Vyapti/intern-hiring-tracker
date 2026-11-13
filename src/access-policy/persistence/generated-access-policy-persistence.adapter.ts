import { ILike } from 'typeorm';
import { parsePositiveId } from '@auth/utils/parse-positive-id.util';
import type {
    AccessPolicyPersistenceAdapter,
    MembershipListArgs,
    MembershipRecord,
    MembershipWriteInput,
    PolicyListArgs,
    PolicyRecord,
    PolicyUpdateInput,
    PolicyWriteInput,
} from '@vyapti/access-policy';
import { AccessPolicy } from '../entities/access_policy.entity';
import { AccessPolicyMembership } from '../entities/access_policy_membership.entity';
import {
    MembershipCreateSchema,
    PolicyCreateSchema,
    PolicyUpdateSchema,
} from '../schema/access-policy-write.schema';
import {
    mapMembershipRecord,
    mapPolicyRecord,
} from '../utils/map-access-policy-record.util';

class GeneratedAccessPolicyPersistenceAdapter
    implements AccessPolicyPersistenceAdapter
{
    async findPolicy(args: {
        entityName: string;
    }): Promise<PolicyRecord | null> {
        const row = await AccessPolicy.one({ entity_name: args.entityName });
        return row ? mapPolicyRecord(row) : null;
    }

    async findPolicyById(args: {
        policyId: string;
    }): Promise<PolicyRecord | null> {
        const policyId = parsePositiveId(args.policyId);
        if (policyId == null) {
            return null;
        }
        const row = await AccessPolicy.getByPk(policyId);
        return row ? mapPolicyRecord(row) : null;
    }

    async listPolicies(
        args: PolicyListArgs,
    ): Promise<{ rows: PolicyRecord[]; total: number }> {
        const where = args.search
            ? { entity_name: ILike(`%${args.search}%`) }
            : {};
        const [rows, total] = await Promise.all([
            AccessPolicy.filter(where, pageOptions(args, 'entity_name')),
            AccessPolicy.countOf(where),
        ]);
        return { rows: mapRows(rows, mapPolicyRecord), total };
    }

    async createPolicy(args: {
        input: PolicyWriteInput;
    }): Promise<PolicyRecord> {
        const payload = PolicyCreateSchema.parse({
            entity_name: args.input.entityName,
            mode: args.input.mode,
            constraint_field: args.input.constraintField,
            scope_key: args.input.scopeKey,
        });
        const created = await AccessPolicy.createOne(payload);
        return mapPolicyRecord(created);
    }

    async updatePolicy(args: {
        policyId: string;
        input: PolicyUpdateInput;
    }): Promise<PolicyRecord | null> {
        const policyId = parsePositiveId(args.policyId);
        if (policyId == null) {
            return null;
        }
        const payload = PolicyUpdateSchema.parse({
            ...(args.input.mode !== undefined ? { mode: args.input.mode } : {}),
            ...(args.input.constraintField !== undefined
                ? { constraint_field: args.input.constraintField }
                : {}),
            ...(args.input.scopeKey !== undefined
                ? { scope_key: args.input.scopeKey }
                : {}),
        });
        if ((await AccessPolicy.updateByPk(policyId, payload)) === 0) {
            return null;
        }
        return this.findPolicyById({ policyId: String(policyId) });
    }

    async deletePolicy(args: { policyId: string }): Promise<boolean> {
        const policyId = parsePositiveId(args.policyId);
        if (policyId == null) {
            return false;
        }
        return (await AccessPolicy.deleteByPk(policyId)) > 0;
    }

    async listMemberships(
        args: MembershipListArgs,
    ): Promise<{ rows: MembershipRecord[]; total: number }> {
        const where = membershipWhere(args);
        const [rows, total] = await Promise.all([
            AccessPolicyMembership.filter(where, pageOptions(args, 'scope_key')),
            AccessPolicyMembership.countOf(where),
        ]);
        return { rows: mapRows(rows, mapMembershipRecord), total };
    }

    async findMembership(args: {
        userId: string;
        scopeKey: string;
        scopeId: string;
    }): Promise<MembershipRecord | null> {
        const row = await AccessPolicyMembership.one({
            user_id: args.userId,
            scope_key: args.scopeKey,
            scope_id: args.scopeId,
        });
        return row ? mapMembershipRecord(row) : null;
    }

    async createMembership(args: {
        input: MembershipWriteInput;
    }): Promise<MembershipRecord> {
        const created = await this.createMemberships({ inputs: [args.input] });
        const membership = created[0];
        if (!membership) {
            throw new Error('Membership was not created');
        }
        return membership;
    }

    async createMemberships(args: {
        inputs: MembershipWriteInput[];
    }): Promise<MembershipRecord[]> {
        const created: MembershipRecord[] = [];
        for (const input of args.inputs) {
            const payload = MembershipCreateSchema.parse({
                user_id: input.userId,
                scope_key: input.scopeKey,
                scope_id: input.scopeId,
            });
            const row = await AccessPolicyMembership.createOne(payload);
            created.push(mapMembershipRecord(row));
        }
        return created;
    }

    async deleteMembership(args: { membershipId: string }): Promise<boolean> {
        const membershipId = parsePositiveId(args.membershipId);
        if (membershipId == null) {
            return false;
        }
        return (await AccessPolicyMembership.deleteByPk(membershipId)) > 0;
    }
}

function membershipWhere(
    args: MembershipListArgs,
): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (args.userId) {
        where.user_id = args.userId;
    }
    if (args.scopeKey) {
        where.scope_key = args.scopeKey;
    }
    if (args.search) {
        where.scope_id = ILike(`%${args.search}%`);
    }
    return where;
}

function pageOptions(
    args: {
        skip?: number;
        take?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    },
    defaultSort: string,
): {
    skip: number;
    take?: number;
    order: Record<string, 'ASC' | 'DESC'>;
} {
    const options: {
        skip: number;
        take?: number;
        order: Record<string, 'ASC' | 'DESC'>;
    } = {
        skip: args.skip ?? 0,
        order: { [args.sortBy ?? defaultSort]: args.sortOrder ?? 'ASC' },
    };
    if (args.take !== undefined) {
        options.take = args.take;
    }
    return options;
}

function mapRows<T>(rows: unknown[], mapRow: (row: unknown) => T): T[] {
    const mapped: T[] = [];
    for (const row of rows) {
        mapped.push(mapRow(row));
    }
    return mapped;
}

function createGeneratedAccessPolicyPersistenceAdapter(): AccessPolicyPersistenceAdapter {
    return new GeneratedAccessPolicyPersistenceAdapter();
}

export {
    GeneratedAccessPolicyPersistenceAdapter,
    createGeneratedAccessPolicyPersistenceAdapter,
};
