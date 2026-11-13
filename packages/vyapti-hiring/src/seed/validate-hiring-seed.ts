import { buildInterviewerMemberships } from '../utils/hiring-access-policy-membership.util.js';
import {
    HIRING_SEED_EXPECTED_COUNTS,
    HIRING_SEED_EXPECTED_TOTAL,
    HIRING_SEED_FK_RULES,
    HIRING_SEED_IMPORT_ORDER,
    HIRING_SEED_RECRUITER_EMAILS,
    HIRING_SEED_RECRUITER_MEMBER_IDS,
} from './hiring-seed.constants.js';
import type { HiringCsvRow } from './parse-hiring-csv.js';

type HiringSeedTables = {
    teamMembers: HiringCsvRow[];
    openings: HiringCsvRow[];
    candidates: HiringCsvRow[];
    assessments: HiringCsvRow[];
    interviews: HiringCsvRow[];
};

type SeedValidationIssue = {
    entity: string;
    businessId: string | null;
    code: string;
    message: string;
};

type MembershipPlanEntry = {
    email: string;
    memberId: string;
    role: string;
    /** Placeholder until live seed resolves auth user id by email. */
    pendingUserId: string;
    membershipCount: number;
    memberScope: boolean;
    assignedCandidateCount: number;
};

type HiringSeedValidationReport = {
    ok: boolean;
    expectedTotal: number;
    actualTotal: number;
    files: Array<{
        fileName: string;
        entityName: string;
        businessIdField: string;
        autoPkField: string;
        expectedCount: number;
        actualCount: number;
    }>;
    importOrder: string[];
    entityMappings: Array<{
        entityName: string;
        businessId: string;
        autoPk: string;
    }>;
    foreignKeys: Array<{
        entityName: string;
        field: string;
        references: string;
        parentEntity: string;
        ok: boolean;
        missingCount: number;
    }>;
    roles: {
        recruiters: Array<{ memberId: string; email: string; role: string }>;
        interviewers: Array<{ memberId: string; email: string; role: string }>;
    };
    membershipPlan: {
        interviewerCount: number;
        membershipCount: number;
        byInterviewer: MembershipPlanEntry[];
    };
    duplicateBusinessIds: Array<{ entity: string; businessId: string }>;
    issues: SeedValidationIssue[];
};

const pushIssue = (
    issues: SeedValidationIssue[],
    issue: SeedValidationIssue,
): void => {
    issues.push(issue);
};

const collectIds = (rows: HiringCsvRow[], field: string): Set<string> => {
    const ids = new Set<string>();
    for (const row of rows) {
        const value = row[field]?.trim() ?? '';
        if (value.length > 0) {
            ids.add(value);
        }
    }
    return ids;
};

const findDuplicateBusinessIds = (
    entity: string,
    rows: HiringCsvRow[],
    field: string,
): Array<{ entity: string; businessId: string }> => {
    const seen = new Set<string>();
    const duplicates: Array<{ entity: string; businessId: string }> = [];
    for (const row of rows) {
        const id = row[field]?.trim() ?? '';
        if (!id) {
            continue;
        }
        if (seen.has(id)) {
            duplicates.push({ entity, businessId: id });
        } else {
            seen.add(id);
        }
    }
    return duplicates;
};

const validateMissingBusinessIds = (
    issues: SeedValidationIssue[],
    entity: string,
    rows: HiringCsvRow[],
    field: string,
): void => {
    rows.forEach((row, index) => {
        const id = row[field]?.trim() ?? '';
        if (!id) {
            pushIssue(issues, {
                entity,
                businessId: null,
                code: 'MISSING_BUSINESS_ID',
                message: `${entity} row ${index + 1} is missing ${field}`,
            });
        }
    });
};

const validateForeignKeys = (
    tables: HiringSeedTables,
    issues: SeedValidationIssue[],
): HiringSeedValidationReport['foreignKeys'] => {
    const memberIds = collectIds(tables.teamMembers, 'member_id');
    const openingIds = collectIds(tables.openings, 'opening_id');
    const candidateIds = collectIds(tables.candidates, 'candidate_id');

    const parentSets: Record<string, Set<string>> = {
        member_id: memberIds,
        opening_id: openingIds,
        candidate_id: candidateIds,
    };

    const entityRows: Record<string, HiringCsvRow[]> = {
        job_opening: tables.openings,
        job_candidate: tables.candidates,
        job_assessment: tables.assessments,
        job_interview: tables.interviews,
    };

    const businessIdField: Record<string, string> = {
        job_opening: 'opening_id',
        job_candidate: 'candidate_id',
        job_assessment: 'assessment_id',
        job_interview: 'interview_id',
    };

    return HIRING_SEED_FK_RULES.map((rule) => {
        const rows = entityRows[rule.entityName] ?? [];
        const parents = parentSets[rule.references] ?? new Set<string>();
        let missingCount = 0;
        for (const row of rows) {
            const value = row[rule.field]?.trim() ?? '';
            const rowId =
                row[businessIdField[rule.entityName] ?? '']?.trim() || null;
            if (!value) {
                missingCount += 1;
                pushIssue(issues, {
                    entity: rule.entityName,
                    businessId: rowId,
                    code: 'MISSING_FK',
                    message: `${rule.entityName}.${rule.field} is empty (expected ${rule.references})`,
                });
                continue;
            }
            if (!parents.has(value)) {
                missingCount += 1;
                pushIssue(issues, {
                    entity: rule.entityName,
                    businessId: rowId,
                    code: 'MISSING_REFERENCE',
                    message: `${rule.entityName}.${rule.field}=${value} does not exist in ${rule.parentEntity}.${rule.references}`,
                });
            }
        }
        return {
            entityName: rule.entityName,
            field: rule.field,
            references: rule.references,
            parentEntity: rule.parentEntity,
            ok: missingCount === 0,
            missingCount,
        };
    });
};

const validateRoles = (
    teamMembers: HiringCsvRow[],
    issues: SeedValidationIssue[],
): HiringSeedValidationReport['roles'] => {
    const recruiters: HiringSeedValidationReport['roles']['recruiters'] = [];
    const interviewers: HiringSeedValidationReport['roles']['interviewers'] =
        [];

    for (const row of teamMembers) {
        const memberId = row.member_id?.trim() ?? '';
        const email = row.email?.trim() ?? '';
        const role = row.role?.trim() ?? '';
        if (role === 'Recruiter') {
            recruiters.push({ memberId, email, role });
        } else if (role === 'Interviewer') {
            interviewers.push({ memberId, email, role });
        } else {
            pushIssue(issues, {
                entity: 'team_member',
                businessId: memberId || null,
                code: 'INVALID_ROLE',
                message: `team_member ${memberId || email} has role "${role}" (expected Recruiter or Interviewer)`,
            });
        }
    }

    for (const expectedId of HIRING_SEED_RECRUITER_MEMBER_IDS) {
        const row = teamMembers.find(
            (member) => member.member_id?.trim() === expectedId,
        );
        if (!row) {
            pushIssue(issues, {
                entity: 'team_member',
                businessId: expectedId,
                code: 'MISSING_RECRUITER',
                message: `Expected recruiter ${expectedId} is missing`,
            });
            continue;
        }
        if (row.role?.trim() !== 'Recruiter') {
            pushIssue(issues, {
                entity: 'team_member',
                businessId: expectedId,
                code: 'RECRUITER_ROLE_MISMATCH',
                message: `${expectedId} must be Recruiter (found ${row.role})`,
            });
        }
    }

    for (const expectedEmail of HIRING_SEED_RECRUITER_EMAILS) {
        const row = teamMembers.find(
            (member) => member.email?.trim() === expectedEmail,
        );
        if (!row || row.role?.trim() !== 'Recruiter') {
            pushIssue(issues, {
                entity: 'team_member',
                businessId: row?.member_id?.trim() ?? null,
                code: 'RECRUITER_EMAIL_MISMATCH',
                message: `Expected recruiter email ${expectedEmail}`,
            });
        }
    }

    for (const row of interviewers) {
        if (
            (HIRING_SEED_RECRUITER_MEMBER_IDS as readonly string[]).includes(
                row.memberId,
            )
        ) {
            pushIssue(issues, {
                entity: 'team_member',
                businessId: row.memberId,
                code: 'ROLE_CONFLICT',
                message: `${row.memberId} cannot be both expected Recruiter and Interviewer`,
            });
        }
    }

    return { recruiters, interviewers };
};

const buildMembershipPlan = (
    tables: HiringSeedTables,
): HiringSeedValidationReport['membershipPlan'] => {
    const assessments = tables.assessments.map((row) => ({
        candidate: row.candidate,
        reviewer: row.reviewer,
    }));
    const interviews = tables.interviews.map((row) => ({
        candidate: row.candidate,
        interviewer: row.interviewer,
    }));

    const byInterviewer: MembershipPlanEntry[] = [];
    let membershipCount = 0;

    for (const row of tables.teamMembers) {
        if (row.role?.trim() !== 'Interviewer') {
            continue;
        }
        const memberId = row.member_id.trim();
        const email = row.email.trim();
        const pendingUserId = `pending:${email}`;
        const memberships = buildInterviewerMemberships({
            userId: pendingUserId,
            memberId,
            assessments,
            interviews,
        });
        const assignedCandidateCount = memberships.filter(
            (item) => item.scopeKey === 'assigned_candidate_id',
        ).length;
        byInterviewer.push({
            email,
            memberId,
            role: 'Interviewer',
            pendingUserId,
            membershipCount: memberships.length,
            memberScope: memberships.some(
                (item) => item.scopeKey === 'member_id',
            ),
            assignedCandidateCount,
        });
        membershipCount += memberships.length;
    }

    return {
        interviewerCount: byInterviewer.length,
        membershipCount,
        byInterviewer,
    };
};

const validateHiringSeedTables = (
    tables: HiringSeedTables,
): HiringSeedValidationReport => {
    const issues: SeedValidationIssue[] = [];

    const counts = {
        team_members: tables.teamMembers.length,
        openings: tables.openings.length,
        candidates: tables.candidates.length,
        assessments: tables.assessments.length,
        interviews: tables.interviews.length,
    };

    const files = HIRING_SEED_IMPORT_ORDER.map((step) => {
        const actualCount = counts[step.countKey];
        const expectedCount = HIRING_SEED_EXPECTED_COUNTS[step.countKey];
        if (actualCount !== expectedCount) {
            pushIssue(issues, {
                entity: step.entityName,
                businessId: null,
                code: 'COUNT_MISMATCH',
                message: `${step.fileName} has ${actualCount} rows (expected ${expectedCount})`,
            });
        }
        validateMissingBusinessIds(
            issues,
            step.entityName,
            tables[
                step.countKey === 'team_members'
                    ? 'teamMembers'
                    : step.countKey === 'openings'
                      ? 'openings'
                      : step.countKey === 'candidates'
                        ? 'candidates'
                        : step.countKey === 'assessments'
                          ? 'assessments'
                          : 'interviews'
            ],
            step.businessIdField,
        );
        return {
            fileName: step.fileName,
            entityName: step.entityName,
            businessIdField: step.businessIdField,
            autoPkField: step.autoPkField,
            expectedCount,
            actualCount,
        };
    });

    const duplicateBusinessIds = [
        ...findDuplicateBusinessIds(
            'team_member',
            tables.teamMembers,
            'member_id',
        ),
        ...findDuplicateBusinessIds(
            'job_opening',
            tables.openings,
            'opening_id',
        ),
        ...findDuplicateBusinessIds(
            'job_candidate',
            tables.candidates,
            'candidate_id',
        ),
        ...findDuplicateBusinessIds(
            'job_assessment',
            tables.assessments,
            'assessment_id',
        ),
        ...findDuplicateBusinessIds(
            'job_interview',
            tables.interviews,
            'interview_id',
        ),
    ];
    for (const duplicate of duplicateBusinessIds) {
        pushIssue(issues, {
            entity: duplicate.entity,
            businessId: duplicate.businessId,
            code: 'DUPLICATE_BUSINESS_ID',
            message: `Duplicate ${duplicate.entity} business id ${duplicate.businessId}`,
        });
    }

    const foreignKeys = validateForeignKeys(tables, issues);
    const roles = validateRoles(tables.teamMembers, issues);
    const membershipPlan = buildMembershipPlan(tables);

    if (membershipPlan.interviewerCount === 0) {
        pushIssue(issues, {
            entity: 'team_member',
            businessId: null,
            code: 'NO_INTERVIEWERS',
            message: 'No Interviewer rows found for membership planning',
        });
    }

    const actualTotal =
        counts.team_members +
        counts.openings +
        counts.candidates +
        counts.assessments +
        counts.interviews;

    if (actualTotal !== HIRING_SEED_EXPECTED_TOTAL) {
        pushIssue(issues, {
            entity: 'seed',
            businessId: null,
            code: 'TOTAL_MISMATCH',
            message: `Total records ${actualTotal} (expected ${HIRING_SEED_EXPECTED_TOTAL})`,
        });
    }

    return {
        ok: issues.length === 0,
        expectedTotal: HIRING_SEED_EXPECTED_TOTAL,
        actualTotal,
        files,
        importOrder: HIRING_SEED_IMPORT_ORDER.map((step) => step.entityName),
        entityMappings: HIRING_SEED_IMPORT_ORDER.map((step) => ({
            entityName: step.entityName,
            businessId: step.businessIdField,
            autoPk: step.autoPkField,
        })),
        foreignKeys,
        roles,
        membershipPlan,
        duplicateBusinessIds,
        issues,
    };
};

/**
 * Plan memberships for live seed after auth user ids are known.
 * Recruiters are omitted (unrestricted via isSystemAdmin bypass).
 */
const planInterviewerMembershipsForUsers = (args: {
    teamMembers: HiringCsvRow[];
    assessments: HiringCsvRow[];
    interviews: HiringCsvRow[];
    emailToUserId: ReadonlyMap<string, string>;
}): ReturnType<typeof buildInterviewerMemberships> => {
    const assessments = args.assessments.map((row) => ({
        candidate: row.candidate,
        reviewer: row.reviewer,
    }));
    const interviews = args.interviews.map((row) => ({
        candidate: row.candidate,
        interviewer: row.interviewer,
    }));
    const planned: ReturnType<typeof buildInterviewerMemberships> = [];
    for (const row of args.teamMembers) {
        if (row.role?.trim() !== 'Interviewer') {
            continue;
        }
        const email = row.email.trim().toLowerCase();
        const userId = args.emailToUserId.get(email);
        if (!userId) {
            throw new Error(
                `Cannot plan memberships: auth user id missing for Interviewer ${row.email}`,
            );
        }
        planned.push(
            ...buildInterviewerMemberships({
                userId,
                memberId: row.member_id.trim(),
                assessments,
                interviews,
            }),
        );
    }
    return planned;
};

export {
    planInterviewerMembershipsForUsers,
    validateHiringSeedTables,
};
export type {
    HiringSeedTables,
    HiringSeedValidationReport,
    MembershipPlanEntry,
    SeedValidationIssue,
};
