import type {
    AccessPolicyPersistenceAdapter,
    MembershipListArgs,
    MembershipRecord,
    MembershipWriteInput,
    PolicyListArgs,
    PolicyRecord,
    PolicyUpdateInput,
    PolicyWriteInput,
} from '../types/access-policy.types.js';

class InMemoryAccessPolicyAdapter implements AccessPolicyPersistenceAdapter {
    policies: PolicyRecord[] = [];
    memberships: MembershipRecord[] = [];
    private nextId = 1;

    findPolicy(args: { entityName: string }): Promise<PolicyRecord | null> {
        return Promise.resolve(
            this.policies.find(function matchEntity(policy) {
                return policy.entityName === args.entityName;
            }) ?? null,
        );
    }

    findPolicyById(args: { policyId: string }): Promise<PolicyRecord | null> {
        return Promise.resolve(
            this.policies.find(function matchId(policy) {
                return String(policy.id) === args.policyId;
            }) ?? null,
        );
    }

    listPolicies(
        args: PolicyListArgs,
    ): Promise<{ rows: PolicyRecord[]; total: number }> {
        const matched = this.policies.filter(function matchSearch(policy) {
            return includesSearch(policy.entityName, args.search);
        });
        const sorted = sortBy(
            matched,
            function readEntity(policy) {
                return policy.entityName;
            },
            args.sortOrder,
        );
        return Promise.resolve(pageRows(sorted, args.skip, args.take));
    }

    createPolicy(args: { input: PolicyWriteInput }): Promise<PolicyRecord> {
        const policy: PolicyRecord = {
            id: this.allocateId(),
            ...args.input,
        };
        this.policies.push(policy);
        return Promise.resolve(policy);
    }

    async updatePolicy(args: {
        policyId: string;
        input: PolicyUpdateInput;
    }): Promise<PolicyRecord | null> {
        const policy = await this.findPolicyById(args);
        if (!policy) {
            return null;
        }
        if (args.input.mode !== undefined) {
            policy.mode = args.input.mode;
        }
        if (args.input.constraintField !== undefined) {
            policy.constraintField = args.input.constraintField;
        }
        if (args.input.scopeKey !== undefined) {
            policy.scopeKey = args.input.scopeKey;
        }
        return policy;
    }

    deletePolicy(args: { policyId: string }): Promise<boolean> {
        const before = this.policies.length;
        this.policies = this.policies.filter(function keep(policy) {
            return String(policy.id) !== args.policyId;
        });
        return Promise.resolve(this.policies.length !== before);
    }

    listMemberships(
        args: MembershipListArgs,
    ): Promise<{ rows: MembershipRecord[]; total: number }> {
        const matched = this.memberships.filter(function match(row) {
            if (args.userId && row.userId !== args.userId) {
                return false;
            }
            if (args.scopeKey && row.scopeKey !== args.scopeKey) {
                return false;
            }
            const haystack = `${row.scopeKey} ${row.scopeId}`;
            return includesSearch(haystack, args.search ?? null);
        });
        const sortKey = args.sortBy ?? 'scope_key';
        const sorted = sortBy(
            matched,
            function readSort(row) {
                return sortKey === 'scope_id' ? row.scopeId : row.scopeKey;
            },
            args.sortOrder ?? 'ASC',
        );
        return Promise.resolve(pageRows(sorted, args.skip ?? 0, args.take));
    }

    findMembership(args: {
        userId: string;
        scopeKey: string;
        scopeId: string;
    }): Promise<MembershipRecord | null> {
        return Promise.resolve(
            this.memberships.find(function match(row) {
                return (
                    row.userId === args.userId &&
                    row.scopeKey === args.scopeKey &&
                    row.scopeId === args.scopeId
                );
            }) ?? null,
        );
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

    createMemberships(args: {
        inputs: MembershipWriteInput[];
    }): Promise<MembershipRecord[]> {
        const created: MembershipRecord[] = [];
        for (const input of args.inputs) {
            const membership: MembershipRecord = {
                id: this.allocateId(),
                ...input,
            };
            this.memberships.push(membership);
            created.push(membership);
        }
        return Promise.resolve(created);
    }

    deleteMembership(args: { membershipId: string }): Promise<boolean> {
        const before = this.memberships.length;
        this.memberships = this.memberships.filter(function keep(row) {
            return String(row.id) !== args.membershipId;
        });
        return Promise.resolve(this.memberships.length !== before);
    }

    private allocateId(): string {
        const id = String(this.nextId);
        this.nextId += 1;
        return id;
    }
}

function includesSearch(value: string, search: string | null): boolean {
    if (!search) {
        return true;
    }
    return value.toLowerCase().includes(search.toLowerCase());
}

function sortBy<T>(
    rows: T[],
    read: (row: T) => string,
    sortOrder: 'ASC' | 'DESC',
): T[] {
    const direction = sortOrder === 'DESC' ? -1 : 1;
    return [...rows].sort(function compare(left, right) {
        return read(left).localeCompare(read(right)) * direction;
    });
}

function pageRows<T>(
    rows: T[],
    skip: number,
    take: number | undefined,
): { rows: T[]; total: number } {
    const sliced =
        take === undefined ? rows.slice(skip) : rows.slice(skip, skip + take);
    return { rows: sliced, total: rows.length };
}

export { InMemoryAccessPolicyAdapter };
