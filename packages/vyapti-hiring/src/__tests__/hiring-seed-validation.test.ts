import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    HIRING_SEED_EXPECTED_COUNTS,
    HIRING_SEED_EXPECTED_TOTAL,
    HIRING_SEED_IMPORT_ORDER,
    parseHiringCsv,
    planInterviewerMembershipsForUsers,
    validateHiringSeedTables,
} from '../seed/index.js';

const REPO_CSV_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../generated/intern-hiring-tracker-seed',
);

async function loadRepoTables() {
    const load = async (fileName: string) =>
        parseHiringCsv(await readFile(path.join(REPO_CSV_DIR, fileName), 'utf8'));
    return {
        teamMembers: await load('team_members.csv'),
        openings: await load('openings.csv'),
        candidates: await load('candidates.csv'),
        assessments: await load('assessments.csv'),
        interviews: await load('interviews.csv'),
    };
}

describe('hiring seed CSV validation (repo seed files)', () => {
    it('validates all 742 records with correct FK order and mappings', async () => {
        const tables = await loadRepoTables();
        const report = validateHiringSeedTables(tables);

        assert.equal(report.ok, true, JSON.stringify(report.issues, null, 2));
        assert.equal(report.actualTotal, HIRING_SEED_EXPECTED_TOTAL);
        assert.equal(report.actualTotal, 742);
        assert.deepEqual(report.importOrder, [
            'team_member',
            'job_opening',
            'job_candidate',
            'job_assessment',
            'job_interview',
        ]);
        assert.equal(
            report.files.find((file) => file.entityName === 'team_member')
                ?.actualCount,
            HIRING_SEED_EXPECTED_COUNTS.team_members,
        );
        assert.equal(
            report.files.find((file) => file.entityName === 'job_candidate')
                ?.actualCount,
            HIRING_SEED_EXPECTED_COUNTS.candidates,
        );
        assert.ok(report.foreignKeys.every((fk) => fk.ok));
        assert.equal(report.duplicateBusinessIds.length, 0);
        assert.equal(report.issues.length, 0);

        const mappings = Object.fromEntries(
            report.entityMappings.map((row) => [
                row.entityName,
                { businessId: row.businessId, autoPk: row.autoPk },
            ]),
        );
        assert.deepEqual(mappings.team_member, {
            businessId: 'member_id',
            autoPk: 'team_member_id',
        });
        assert.deepEqual(mappings.job_opening, {
            businessId: 'opening_id',
            autoPk: 'job_opening_id',
        });
        assert.deepEqual(mappings.job_candidate, {
            businessId: 'candidate_id',
            autoPk: 'job_candidate_id',
        });
        assert.deepEqual(mappings.job_assessment, {
            businessId: 'assessment_id',
            autoPk: 'job_assessment_id',
        });
        assert.deepEqual(mappings.job_interview, {
            businessId: 'interview_id',
            autoPk: 'job_interview_id',
        });
        assert.equal(HIRING_SEED_IMPORT_ORDER.length, 5);
    });

    it('maps Fatima and Vikram as Recruiters and the other six as Interviewers', async () => {
        const tables = await loadRepoTables();
        const report = validateHiringSeedTables(tables);
        assert.equal(report.roles.recruiters.length, 2);
        assert.equal(report.roles.interviewers.length, 6);
        assert.deepEqual(
            report.roles.recruiters.map((row) => row.memberId).sort(),
            ['TM-01', 'TM-02'],
        );
        assert.ok(
            report.roles.recruiters.every((row) => row.role === 'Recruiter'),
        );
        assert.ok(
            report.roles.interviewers.every(
                (row) => row.role === 'Interviewer',
            ),
        );
    });

    it('plans interviewer memberships without duplicates', async () => {
        const tables = await loadRepoTables();
        const report = validateHiringSeedTables(tables);
        assert.equal(report.membershipPlan.interviewerCount, 6);
        assert.ok(report.membershipPlan.membershipCount >= 6);
        assert.ok(
            report.membershipPlan.byInterviewer.every(
                (row) => row.memberScope === true,
            ),
        );

        const emailToUserId = new Map(
            report.roles.interviewers.map((row) => [
                row.email.toLowerCase(),
                `user-${row.memberId}`,
            ]),
        );
        const planned = planInterviewerMembershipsForUsers({
            teamMembers: tables.teamMembers,
            assessments: tables.assessments,
            interviews: tables.interviews,
            emailToUserId,
        });
        assert.equal(planned.length, report.membershipPlan.membershipCount);

        const keys = planned.map(
            (row) => `${row.userId}|${row.scopeKey}|${row.scopeId}`,
        );
        assert.equal(keys.length, new Set(keys).size);

        for (const recruiter of report.roles.recruiters) {
            assert.equal(
                planned.some((row) =>
                    row.userId.includes(recruiter.memberId),
                ),
                false,
            );
        }
    });

    it('rejects missing FK references and duplicate business ids', () => {
        const report = validateHiringSeedTables({
            teamMembers: [
                {
                    member_id: 'TM-01',
                    name: 'Fatima',
                    email: 'fatima@kiranbyte.example',
                    role: 'Recruiter',
                    team: 'HR',
                    status: 'Active',
                },
                {
                    member_id: 'TM-02',
                    name: 'Vikram',
                    email: 'vikram@kiranbyte.example',
                    role: 'Recruiter',
                    team: 'Ops',
                    status: 'Active',
                },
                {
                    member_id: 'TM-03',
                    name: 'Aarav',
                    email: 'aarav@kiranbyte.example',
                    role: 'Interviewer',
                    team: 'Eng',
                    status: 'Active',
                },
            ],
            openings: [
                {
                    opening_id: 'OPN-01',
                    title: 'Intern',
                    team: 'Eng',
                    location: 'Remote',
                    stipend_inr: '1',
                    positions: '1',
                    posted_on: '',
                    closes_on: '',
                    status: 'Open',
                    interview_rounds: '1',
                    assessment_name: 'A',
                    assessment_days: '3',
                    owner: 'TM-MISSING',
                },
            ],
            candidates: [
                {
                    candidate_id: 'CAN-0001',
                    opening: 'OPN-MISSING',
                    name: 'A',
                    email: 'a@example.com',
                    college: 'C',
                    degree: 'D',
                    graduation_year: '2027',
                    source: 'LinkedIn',
                    resume_link: 'https://x',
                    applied_on: '2026-01-01',
                    stage: 'Applied',
                    stage_updated_on: '2026-01-01',
                    rejected_reason: '',
                    joining_on: '',
                    notes: '',
                },
                {
                    candidate_id: 'CAN-0001',
                    opening: 'OPN-01',
                    name: 'B',
                    email: 'b@example.com',
                    college: 'C',
                    degree: 'D',
                    graduation_year: '2027',
                    source: 'LinkedIn',
                    resume_link: 'https://x',
                    applied_on: '2026-01-01',
                    stage: 'Applied',
                    stage_updated_on: '2026-01-01',
                    rejected_reason: '',
                    joining_on: '',
                    notes: '',
                },
            ],
            assessments: [],
            interviews: [],
        });

        assert.equal(report.ok, false);
        assert.ok(
            report.issues.some((issue) => issue.code === 'MISSING_REFERENCE'),
        );
        assert.ok(
            report.issues.some(
                (issue) => issue.code === 'DUPLICATE_BUSINESS_ID',
            ),
        );
        assert.ok(
            report.issues.some((issue) => issue.code === 'COUNT_MISMATCH'),
        );
    });
});
