/**
 * Intern Hiring Tracker CSV seed contract.
 * Counts match generated/intern-hiring-tracker-seed/validation-report.json.
 */

const HIRING_SEED_EXPECTED_COUNTS = {
    team_members: 8,
    openings: 6,
    candidates: 445,
    assessments: 176,
    interviews: 107,
} as const;

const HIRING_SEED_EXPECTED_TOTAL =
    HIRING_SEED_EXPECTED_COUNTS.team_members +
    HIRING_SEED_EXPECTED_COUNTS.openings +
    HIRING_SEED_EXPECTED_COUNTS.candidates +
    HIRING_SEED_EXPECTED_COUNTS.assessments +
    HIRING_SEED_EXPECTED_COUNTS.interviews;

/** FK-safe import order (parent before child). */
const HIRING_SEED_IMPORT_ORDER = [
    {
        fileName: 'team_members.csv',
        entityName: 'team_member',
        businessIdField: 'member_id',
        autoPkField: 'team_member_id',
        route: '/vulcan/team_member',
        countKey: 'team_members',
    },
    {
        fileName: 'openings.csv',
        entityName: 'job_opening',
        businessIdField: 'opening_id',
        autoPkField: 'job_opening_id',
        route: '/vulcan/job_opening',
        countKey: 'openings',
    },
    {
        fileName: 'candidates.csv',
        entityName: 'job_candidate',
        businessIdField: 'candidate_id',
        autoPkField: 'job_candidate_id',
        route: '/vulcan/job_candidate',
        countKey: 'candidates',
    },
    {
        fileName: 'assessments.csv',
        entityName: 'job_assessment',
        businessIdField: 'assessment_id',
        autoPkField: 'job_assessment_id',
        route: '/vulcan/job_assessment',
        countKey: 'assessments',
    },
    {
        fileName: 'interviews.csv',
        entityName: 'job_interview',
        businessIdField: 'interview_id',
        autoPkField: 'job_interview_id',
        route: '/vulcan/job_interview',
        countKey: 'interviews',
    },
] as const;

const HIRING_SEED_FK_RULES = [
    {
        entityName: 'job_opening',
        field: 'owner',
        references: 'member_id',
        parentEntity: 'team_member',
    },
    {
        entityName: 'job_candidate',
        field: 'opening',
        references: 'opening_id',
        parentEntity: 'job_opening',
    },
    {
        entityName: 'job_assessment',
        field: 'candidate',
        references: 'candidate_id',
        parentEntity: 'job_candidate',
    },
    {
        entityName: 'job_assessment',
        field: 'reviewer',
        references: 'member_id',
        parentEntity: 'team_member',
    },
    {
        entityName: 'job_interview',
        field: 'candidate',
        references: 'candidate_id',
        parentEntity: 'job_candidate',
    },
    {
        entityName: 'job_interview',
        field: 'interviewer',
        references: 'member_id',
        parentEntity: 'team_member',
    },
] as const;

const HIRING_SEED_RECRUITER_MEMBER_IDS = ['TM-01', 'TM-02'] as const;
const HIRING_SEED_RECRUITER_EMAILS = [
    'fatima@kiranbyte.example',
    'vikram@kiranbyte.example',
] as const;

export {
    HIRING_SEED_EXPECTED_COUNTS,
    HIRING_SEED_EXPECTED_TOTAL,
    HIRING_SEED_FK_RULES,
    HIRING_SEED_IMPORT_ORDER,
    HIRING_SEED_RECRUITER_EMAILS,
    HIRING_SEED_RECRUITER_MEMBER_IDS,
};
