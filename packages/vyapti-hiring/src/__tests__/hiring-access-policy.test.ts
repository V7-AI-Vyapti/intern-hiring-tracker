import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
    AccessPolicyFilterService,
    applyAccessFilter,
    assertUpdateScope,
    prepareCreateBody,
    type AccessFilter,
    type AccessPolicyPersistenceAdapter,
    type MembershipRecord,
    type PolicyRecord,
    type PolicyWriteInput,
} from '@vyapti/access-policy';
import {
    HIRING_ACCESS_POLICY_DEFINITIONS,
    HIRING_ACCESS_POLICY_SCOPE_KEYS,
    HIRING_ENTITY_RESOURCES,
    buildInterviewerMemberships,
    hiringEntityAllowsCrudRead,
    hiringEntityAllowsCrudWrite,
    hiringEntityAllowsDelete,
} from '../index.js';

const RECRUITER_USER = '10';
const INTERVIEWER_USER = '20';
const OTHER_INTERVIEWER_USER = '30';

class HiringAccessPolicyMemoryAdapter implements AccessPolicyPersistenceAdapter {
    policies: PolicyRecord[] = [];
    memberships: MembershipRecord[] = [];
    private nextId = 1;

    async findPolicy(args: { entityName: string }) {
        return (
            this.policies.find((policy) => policy.entityName === args.entityName) ??
            null
        );
    }

    async findPolicyById(args: { policyId: string }) {
        return (
            this.policies.find((policy) => String(policy.id) === args.policyId) ??
            null
        );
    }

    async listPolicies() {
        return { rows: [...this.policies], total: this.policies.length };
    }

    async createPolicy(args: { input: PolicyWriteInput }) {
        const policy: PolicyRecord = { id: this.nextId++, ...args.input };
        this.policies.push(policy);
        return policy;
    }

    async updatePolicy() {
        return null;
    }

    async deletePolicy() {
        return false;
    }

    async listMemberships(args: {
        userId?: string | null;
        scopeKey?: string | null;
    }) {
        const rows = this.memberships.filter((row) => {
            if (args.userId && row.userId !== args.userId) {
                return false;
            }
            if (args.scopeKey && row.scopeKey !== args.scopeKey) {
                return false;
            }
            return true;
        });
        return { rows, total: rows.length };
    }

    async createMembership(args: {
        input: { userId: string; scopeKey: string; scopeId: string };
    }) {
        const row: MembershipRecord = { id: this.nextId++, ...args.input };
        this.memberships.push(row);
        return row;
    }

    async createMemberships(args: {
        inputs: Array<{ userId: string; scopeKey: string; scopeId: string }>;
    }) {
        const rows: MembershipRecord[] = [];
        for (const input of args.inputs) {
            rows.push(await this.createMembership({ input }));
        }
        return rows;
    }

    async deleteMembership() {
        return false;
    }
}

const seedHiringPolicies = async (
    adapter: HiringAccessPolicyMemoryAdapter,
): Promise<void> => {
    for (const policy of HIRING_ACCESS_POLICY_DEFINITIONS) {
        await adapter.createPolicy({ input: { ...policy } });
    }
};

const seedInterviewerScopes = async (
    adapter: HiringAccessPolicyMemoryAdapter,
): Promise<void> => {
    const memberships = buildInterviewerMemberships({
        userId: INTERVIEWER_USER,
        memberId: 'TM-07',
        assessments: [
            { candidate: 'CAN-0354', reviewer: 'TM-07' },
            { candidate: 'CAN-0999', reviewer: 'TM-08' },
        ],
        interviews: [
            { candidate: 'CAN-0235', interviewer: 'TM-07' },
            { candidate: 'CAN-0235', interviewer: 'TM-08' },
        ],
    });
    for (const membership of memberships) {
        await adapter.createMembership({ input: membership });
    }
    await adapter.createMembership({
        input: {
            userId: OTHER_INTERVIEWER_USER,
            scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID,
            scopeId: 'TM-08',
        },
    });
};

/** Minimal cache stub — AccessPolicyCacheService is not a public export. */
class PassthroughAccessPolicyCache {
    get(): AccessFilter | undefined {
        return undefined;
    }
    set(): void {}
    clear(): void {}
}

const buildFilters = (adapter: HiringAccessPolicyMemoryAdapter) =>
    new AccessPolicyFilterService(
        adapter,
        new PassthroughAccessPolicyCache() as never,
    );

describe('Hiring access-policy definitions', () => {
    it('covers all five entities and disables delete', () => {
        const entities = HIRING_ACCESS_POLICY_DEFINITIONS.map(
            (policy) => policy.entityName,
        );
        assert.deepEqual(
            [...entities].sort(),
            [...HIRING_ENTITY_RESOURCES].sort(),
        );
        assert.equal(hiringEntityAllowsDelete(), false);
        for (const entityName of HIRING_ENTITY_RESOURCES) {
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Recruiter',
                    entityName,
                    action: 'delete',
                }),
                false,
            );
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Interviewer',
                    entityName,
                    action: 'create',
                }),
                false,
            );
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Interviewer',
                    entityName,
                    action: 'update',
                }),
                false,
            );
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Recruiter',
                    entityName,
                    action: 'update',
                }),
                true,
            );
            assert.equal(
                hiringEntityAllowsCrudRead({
                    roleName: 'Interviewer',
                    entityName,
                }),
                true,
            );
        }
    });

    it('materializes assigned candidate ids from reviewer OR interviewer rows', () => {
        const memberships = buildInterviewerMemberships({
            userId: 'u1',
            memberId: 'TM-07',
            assessments: [
                { candidate: 'CAN-A', reviewer: 'TM-07' },
                { candidate: 'CAN-B', reviewer: 'TM-08' },
            ],
            interviews: [
                { candidate: 'CAN-C', interviewer: 'TM-07' },
                { candidate: 'CAN-A', interviewer: 'TM-07' },
            ],
        });
        const candidateScopes = memberships
            .filter(
                (row) =>
                    row.scopeKey ===
                    HIRING_ACCESS_POLICY_SCOPE_KEYS.ASSIGNED_CANDIDATE_ID,
            )
            .map((row) => row.scopeId);
        assert.deepEqual(candidateScopes, ['CAN-A', 'CAN-C']);
        assert.ok(
            memberships.some(
                (row) =>
                    row.scopeKey === HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID &&
                    row.scopeId === 'TM-07',
            ),
        );
    });
});

describe('Hiring access-policy CRUD filters', () => {
    it('gives Recruiter unrestricted access via isSystemAdmin bypass', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        const filters = buildFilters(adapter);

        for (const entityName of HIRING_ENTITY_RESOURCES) {
            const filter = await filters.resolveFilter({
                userId: RECRUITER_USER,
                entityName,
                isSystemAdmin: true,
            });
            assert.deepEqual(filter, { unrestricted: true });
            assert.equal(applyAccessFilter(filter).kind, 'none');
        }

        await filters.assertRow({
            userId: RECRUITER_USER,
            entityName: 'job_candidate',
            isSystemAdmin: true,
            row: { candidate_id: 'CAN-ANY' },
        });
    });

    it('limits Interviewer assessments and interviews to own member_id', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        await seedInterviewerScopes(adapter);
        const filters = buildFilters(adapter);

        assert.deepEqual(
            await filters.resolveFilter({
                userId: INTERVIEWER_USER,
                entityName: 'job_assessment',
                isSystemAdmin: false,
            }),
            { field: 'reviewer', op: 'in', values: ['TM-07'] },
        );

        await filters.assertRow({
            userId: INTERVIEWER_USER,
            entityName: 'job_assessment',
            isSystemAdmin: false,
            row: { assessment_id: 'ASM-1', reviewer: 'TM-07' },
        });
        await assert.rejects(
            () =>
                filters.assertRow({
                    userId: INTERVIEWER_USER,
                    entityName: 'job_assessment',
                    isSystemAdmin: false,
                    row: { assessment_id: 'ASM-2', reviewer: 'TM-08' },
                }),
            (error: Error) => error instanceof NotFoundException,
        );

        assert.deepEqual(
            await filters.resolveFilter({
                userId: INTERVIEWER_USER,
                entityName: 'job_interview',
                isSystemAdmin: false,
            }),
            { field: 'interviewer', op: 'in', values: ['TM-07'] },
        );
        await assert.rejects(
            () =>
                filters.assertRow({
                    userId: INTERVIEWER_USER,
                    entityName: 'job_interview',
                    isSystemAdmin: false,
                    row: { interview_id: 'INT-1', interviewer: 'TM-08' },
                }),
            (error: Error) => error instanceof NotFoundException,
        );
    });

    it('limits Interviewer candidates to assigned ids and denies direct unassigned ids', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        await seedInterviewerScopes(adapter);
        const filters = buildFilters(adapter);

        const filter = await filters.resolveFilter({
            userId: INTERVIEWER_USER,
            entityName: 'job_candidate',
            isSystemAdmin: false,
        });
        assert.deepEqual(filter, {
            field: 'candidate_id',
            op: 'in',
            values: ['CAN-0235', 'CAN-0354'],
        });
        assert.deepEqual(applyAccessFilter(filter), {
            kind: 'in',
            field: 'candidate_id',
            values: ['CAN-0235', 'CAN-0354'],
        });

        await filters.assertRow({
            userId: INTERVIEWER_USER,
            entityName: 'job_candidate',
            isSystemAdmin: false,
            row: { candidate_id: 'CAN-0354' },
        });
        await assert.rejects(
            () =>
                filters.assertRow({
                    userId: INTERVIEWER_USER,
                    entityName: 'job_candidate',
                    isSystemAdmin: false,
                    row: { candidate_id: 'CAN-0999' },
                }),
            (error: Error) => error instanceof NotFoundException,
        );
    });

    it('keeps job_opening unrestricted for Interviewers', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        const filters = buildFilters(adapter);
        assert.deepEqual(
            await filters.resolveFilter({
                userId: INTERVIEWER_USER,
                entityName: 'job_opening',
                isSystemAdmin: false,
            }),
            { unrestricted: true },
        );
    });

    it('restricts team_member list/view to self for Interviewers', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        await seedInterviewerScopes(adapter);
        const filters = buildFilters(adapter);
        assert.deepEqual(
            await filters.resolveFilter({
                userId: INTERVIEWER_USER,
                entityName: 'team_member',
                isSystemAdmin: false,
            }),
            { field: 'member_id', op: 'in', values: ['TM-07'] },
        );
        await assert.rejects(
            () =>
                filters.assertRow({
                    userId: INTERVIEWER_USER,
                    entityName: 'team_member',
                    isSystemAdmin: false,
                    row: { member_id: 'TM-01' },
                }),
            (error: Error) => error instanceof NotFoundException,
        );
    });

    it('blocks unauthorized CRUD writes outside interviewer membership scope', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        await seedInterviewerScopes(adapter);
        const filters = buildFilters(adapter);
        const filter = await filters.resolveFilter({
            userId: INTERVIEWER_USER,
            entityName: 'job_assessment',
            isSystemAdmin: false,
        });

        assert.throws(
            () =>
                prepareCreateBody({
                    filter,
                    body: { reviewer: 'TM-08', assessment_id: 'ASM-X' },
                }),
            (error: Error) => error instanceof BadRequestException,
        );
        assert.throws(
            () => assertUpdateScope({ filter, body: { reviewer: 'TM-08' } }),
            (error: Error) => error instanceof BadRequestException,
        );
        assert.equal(
            hiringEntityAllowsCrudWrite({
                roleName: 'Interviewer',
                entityName: 'job_assessment',
                action: 'create',
            }),
            false,
        );
    });

    it('returns empty list clause when Interviewer has no memberships', async () => {
        const adapter = new HiringAccessPolicyMemoryAdapter();
        await seedHiringPolicies(adapter);
        const filters = buildFilters(adapter);
        const filter = await filters.resolveFilter({
            userId: '999',
            entityName: 'job_candidate',
            isSystemAdmin: false,
        });
        assert.deepEqual(filter, {
            field: 'candidate_id',
            op: 'in',
            values: [],
        });
        assert.equal(applyAccessFilter(filter).kind, 'empty');
    });
});
