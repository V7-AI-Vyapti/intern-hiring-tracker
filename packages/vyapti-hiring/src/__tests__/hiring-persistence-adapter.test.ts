import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHiringPersistenceFromOps } from '../../host/persistence/create-hiring-persistence-from-ops.ts';
import type {
    HiringEntityBundle,
    HiringEntityOps,
} from '../../host/persistence/hiring-entity-ops.ts';

type StoreRow = Record<string, unknown> & { __pk: number };

const deepMatch = (
    row: Record<string, unknown>,
    where: Record<string, unknown>,
): boolean => {
    for (const [key, expected] of Object.entries(where)) {
        const actual = row[key];
        if (
            expected &&
            typeof expected === 'object' &&
            !Array.isArray(expected)
        ) {
            if (!actual || typeof actual !== 'object') {
                return false;
            }
            if (
                !deepMatch(
                    actual as Record<string, unknown>,
                    expected as Record<string, unknown>,
                )
            ) {
                return false;
            }
            continue;
        }
        if (actual !== expected) {
            return false;
        }
    }
    return true;
};

const createMemoryOps = (args: {
    pkField: string;
    relations: ReadonlySet<string>;
    seed?: StoreRow[];
}): HiringEntityOps & { rows: StoreRow[] } => {
    let seq = 0;
    const rows: StoreRow[] = [...(args.seed ?? [])];
    for (const row of rows) {
        if (typeof row.__pk === 'number' && row.__pk > seq) {
            seq = row.__pk;
        }
    }

    const assertValidRelations = (
        relations: Record<string, boolean> | undefined,
    ): void => {
        if (!relations) {
            return;
        }
        for (const [propertyName, enabled] of Object.entries(relations)) {
            if (enabled && !args.relations.has(propertyName)) {
                throw new Error(
                    `EntityPropertyNotFound: property ${propertyName} was not found in entity (not a relation)`,
                );
            }
        }
    };

    const assertValidWhere = (where: Record<string, unknown>): void => {
        for (const [propertyName, expected] of Object.entries(where)) {
            if (
                expected &&
                typeof expected === 'object' &&
                !Array.isArray(expected) &&
                !args.relations.has(propertyName)
            ) {
                throw new Error(
                    `Invalid nested where on scalar property '${propertyName}'`,
                );
            }
        }
    };

    return {
        rows,
        async one(where, options) {
            assertValidRelations(options?.relations);
            assertValidWhere(where);
            const found =
                rows.find((row) => deepMatch(row, where)) ?? null;
            if (!found) {
                return null;
            }
            return projectRow(found, options?.relations);
        },
        async filter(where, options) {
            assertValidRelations(options?.relations);
            assertValidWhere(where);
            return rows
                .filter((row) => deepMatch(row, where))
                .map((row) => projectRow(row, options?.relations));
        },
        async createOne(data) {
            seq += 1;
            const stored: StoreRow = {
                ...normalizeWrite(data, args.relations),
                __pk: seq,
                [args.pkField]: seq,
            };
            rows.push(stored);
            return { ...stored };
        },
        async updateByPk(id, patch) {
            const index = rows.findIndex((row) => row.__pk === id);
            if (index < 0) {
                return 0;
            }
            rows[index] = {
                ...rows[index],
                ...normalizeWrite(patch, args.relations),
            };
            return 1;
        },
        getPrimaryKey(row) {
            return (row as StoreRow).__pk;
        },
        isRelation(propertyName) {
            return args.relations.has(propertyName);
        },
    };
};

const normalizeWrite = (
    data: Record<string, unknown>,
    relations: ReadonlySet<string>,
): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...data };
    for (const key of relations) {
        const value = out[key];
        if (value && typeof value === 'object') {
            out[key] = value;
        }
    }
    return out;
};

const projectRow = (
    row: StoreRow,
    relations?: Record<string, boolean>,
): Record<string, unknown> => {
    const projected: Record<string, unknown> = { ...row };
    if (!relations) {
        return projected;
    }
    for (const [key, enabled] of Object.entries(relations)) {
        if (!enabled) {
            continue;
        }
        // Relations already stored as nested objects in this mock.
        void key;
    }
    return projected;
};

const createBundle = (): HiringEntityBundle & {
    teamMember: HiringEntityOps & { rows: StoreRow[] };
    opening: HiringEntityOps & { rows: StoreRow[] };
    candidate: HiringEntityOps & { rows: StoreRow[] };
    assessment: HiringEntityOps & { rows: StoreRow[] };
    interview: HiringEntityOps & { rows: StoreRow[] };
} => {
    const teamMember = createMemoryOps({
        pkField: 'team_member_id',
        relations: new Set(),
        seed: [
            {
                __pk: 1,
                team_member_id: 1,
                member_id: 'TM-01',
                name: 'Asha',
                email: 'asha@example.com',
                role: 'Recruiter',
                team: 'Talent',
                status: 'Active',
            },
            {
                __pk: 2,
                team_member_id: 2,
                member_id: 'TM-07',
                name: 'Dev',
                email: 'dev@example.com',
                role: 'Interviewer',
                team: 'Eng',
                status: 'Active',
            },
        ],
    });

    const opening = createMemoryOps({
        pkField: 'job_opening_id',
        relations: new Set(['owner']),
        seed: [
            {
                __pk: 1,
                job_opening_id: 1,
                opening_id: 'OPN-03',
                title: 'Intern',
                team: 'Eng',
                location: 'Remote',
                stipend_inr: 25000,
                positions: 2,
                posted_on: '2026-01-01',
                closes_on: null,
                status: 'Open',
                interview_rounds: 2,
                assessment_name: 'Take-home',
                assessment_days: 5,
                owner: {
                    member_id: 'TM-01',
                    name: 'Asha',
                    email: 'asha@example.com',
                },
            },
        ],
    });

    const candidate = createMemoryOps({
        pkField: 'job_candidate_id',
        // Simulate incomplete FK map: opening stored as scalar business id
        relations: new Set(),
    });

    const assessment = createMemoryOps({
        pkField: 'job_assessment_id',
        relations: new Set(['candidate', 'reviewer']),
    });

    const interview = createMemoryOps({
        pkField: 'job_interview_id',
        relations: new Set(['candidate', 'interviewer']),
    });

    return {
        teamMember,
        opening,
        candidate,
        assessment,
        interview,
        async withTransaction(work) {
            return work();
        },
    };
};

describe('hiring persistence adapter (mocked entity ops)', () => {
    it('finds team members and openings', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);

        const byEmail = await adapter.findTeamMemberByEmail(
            'ASHA@example.com',
        );
        assert.equal(byEmail?.member_id, 'TM-01');

        const byId = await adapter.findTeamMemberById('TM-07');
        assert.equal(byId?.email, 'dev@example.com');

        const opening = await adapter.findOpeningById('OPN-03');
        assert.equal(opening?.owner, 'TM-01');
        assert.equal(opening?.positions, 2);
    });

    it('creates and updates candidates using scalar opening id', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);

        const created = await adapter.createCandidate({
            candidate_id: 'CAN-0001',
            opening: 'OPN-03',
            name: 'Riya',
            email: 'riya@example.com',
            college: 'IIT',
            degree: 'BTech',
            graduation_year: 2027,
            source: 'Campus',
            resume_link: 'https://example.com/r',
            applied_on: '2026-02-01',
            stage: 'Applied',
            stage_updated_on: '2026-02-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });
        assert.equal(created.candidate_id, 'CAN-0001');
        assert.equal(created.opening, 'OPN-03');
        assert.equal(
            typeof bundle.candidate.rows[0]?.opening,
            'string',
            'incomplete FK map keeps opening as business-id string',
        );

        const updated = await adapter.updateCandidate('CAN-0001', {
            stage: 'Screening',
            stage_updated_on: '2026-02-02',
        });
        assert.equal(updated.stage, 'Screening');
    });

    it('creates assessments with related FK entities and allocates next ids', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);

        await adapter.createCandidate({
            candidate_id: 'CAN-0010',
            opening: 'OPN-03',
            name: 'Riya',
            email: 'riya@example.com',
            college: 'IIT',
            degree: 'BTech',
            graduation_year: 2027,
            source: 'Campus',
            resume_link: 'https://example.com/r',
            applied_on: '2026-02-01',
            stage: 'Assessment',
            stage_updated_on: '2026-02-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });

        const assessment = await adapter.createAssessment({
            assessment_id: 'ASM-010',
            candidate: 'CAN-0010',
            reviewer: 'TM-07',
            sent_on: '2026-02-03',
            due_on: '2026-02-08',
            submitted_on: null,
            submission_link: null,
            score: null,
            result: 'Pending',
            reviewed_on: null,
        });
        assert.equal(assessment.candidate, 'CAN-0010');
        assert.equal(assessment.reviewer, 'TM-07');
        assert.equal(
            typeof bundle.assessment.rows[0]?.candidate,
            'object',
            'relation fields store related row objects',
        );

        assert.equal(await adapter.nextCandidateId(), 'CAN-0011');
        assert.equal(await adapter.nextAssessmentId(), 'ASM-011');
        assert.equal(await adapter.nextInterviewId(), 'INT-001');
    });

    it('cancels scheduled interviews for a candidate', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);

        await adapter.createCandidate({
            candidate_id: 'CAN-0020',
            opening: 'OPN-03',
            name: 'Riya',
            email: 'riya@example.com',
            college: 'IIT',
            degree: 'BTech',
            graduation_year: 2027,
            source: 'Campus',
            resume_link: 'https://example.com/r',
            applied_on: '2026-02-01',
            stage: 'Interview',
            stage_updated_on: '2026-02-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });

        await adapter.createInterview({
            interview_id: 'INT-001',
            candidate: 'CAN-0020',
            round: 1,
            interviewer: 'TM-07',
            scheduled_at: '2026-02-10T10:00:00+05:30',
            mode: 'Video',
            status: 'Scheduled',
            rating: null,
            recommendation: null,
            feedback: null,
            feedback_on: null,
        });
        await adapter.createInterview({
            interview_id: 'INT-002',
            candidate: 'CAN-0020',
            round: 2,
            interviewer: 'TM-07',
            scheduled_at: '2026-02-12T10:00:00+05:30',
            mode: 'Video',
            status: 'Completed',
            rating: 4,
            recommendation: 'Hire',
            feedback: 'Strong',
            feedback_on: '2026-02-12',
        });

        const cancelled = await adapter.cancelScheduledInterviews('CAN-0020');
        assert.equal(cancelled, 1);

        const interviews = await adapter.listInterviewsForCandidate('CAN-0020');
        assert.equal(
            interviews.find((row) => row.interview_id === 'INT-001')?.status,
            'Cancelled',
        );
        assert.equal(
            interviews.find((row) => row.interview_id === 'INT-002')?.status,
            'Completed',
        );
    });

    it('throws on missing update targets', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);
        await assert.rejects(
            () => adapter.updateCandidate('CAN-9999', { stage: 'Hired' }),
            /missing candidate CAN-9999/,
        );
    });

    it('counts hired candidates for an opening', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);
        await adapter.createCandidate({
            candidate_id: 'CAN-0030',
            opening: 'OPN-03',
            name: 'A',
            email: 'a@example.com',
            college: 'X',
            degree: 'Y',
            graduation_year: 2026,
            source: 'Referral',
            resume_link: 'https://example.com/a',
            applied_on: '2026-01-01',
            stage: 'Hired',
            stage_updated_on: '2026-01-20',
            rejected_reason: null,
            joining_on: '2026-02-01',
            notes: null,
        });
        await adapter.createCandidate({
            candidate_id: 'CAN-0031',
            opening: 'OPN-03',
            name: 'B',
            email: 'b@example.com',
            college: 'X',
            degree: 'Y',
            graduation_year: 2026,
            source: 'Referral',
            resume_link: 'https://example.com/b',
            applied_on: '2026-01-01',
            stage: 'Applied',
            stage_updated_on: '2026-01-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });
        assert.equal(await adapter.countHiredForOpening('OPN-03'), 1);
    });

    it('does not request TypeORM relations for scalar FK properties', async () => {
        const bundle = createBundle();
        const adapter = createHiringPersistenceFromOps(bundle);

        await adapter.createCandidate({
            candidate_id: 'CAN-0040',
            opening: 'OPN-03',
            name: 'Riya',
            email: 'riya40@example.com',
            college: 'IIT',
            degree: 'BTech',
            graduation_year: 2027,
            source: 'Campus',
            resume_link: 'https://example.com/r',
            applied_on: '2026-02-01',
            stage: 'Applied',
            stage_updated_on: '2026-02-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });

        // Would throw if relations: { opening: true } were passed for scalar opening.
        const listed = await adapter.listCandidates();
        assert.equal(listed.length, 1);
        assert.equal(listed[0]?.opening, 'OPN-03');

        const found = await adapter.findCandidateById('CAN-0040');
        assert.equal(found?.opening, 'OPN-03');
    });

    it('finds assessments via scalar candidate id when candidate is not a relation', async () => {
        const assessment = createMemoryOps({
            pkField: 'job_assessment_id',
            relations: new Set(['reviewer']),
            seed: [
                {
                    __pk: 1,
                    job_assessment_id: 1,
                    assessment_id: 'ASM-099',
                    candidate: 'CAN-0099',
                    reviewer: { member_id: 'TM-07' },
                    sent_on: '2026-02-03',
                    due_on: '2026-02-08',
                    submitted_on: null,
                    submission_link: null,
                    score: null,
                    result: 'Pending',
                    reviewed_on: null,
                },
            ],
        });
        const bundle = createBundle();
        bundle.assessment = assessment;
        const adapter = createHiringPersistenceFromOps(bundle);

        // Nested where on scalar candidate would throw; scalar path must be used.
        const row = await adapter.findAssessmentByCandidate('CAN-0099');
        assert.equal(row?.assessment_id, 'ASM-099');
        assert.equal(row?.candidate, 'CAN-0099');
    });
});
