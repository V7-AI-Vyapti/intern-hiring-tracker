/**
 * Verified from configured project entity_name values and
 * generated/intern-hiring-tracker-seed/validation-report.json.
 *
 * Codegen class names (PascalCase): TeamMember, JobOpening, JobCandidate,
 * JobAssessment, JobInterview. Runtime lookup uses entity_name / tableName via
 * getEntityWithName — do not hard-import generated entity modules.
 */
const GENERATED_HIRING_ENTITY_NAMES = {
    TEAM_MEMBER: 'team_member',
    JOB_OPENING: 'job_opening',
    JOB_CANDIDATE: 'job_candidate',
    JOB_ASSESSMENT: 'job_assessment',
    JOB_INTERVIEW: 'job_interview',
    RBAC_CATALOG: 'rbac_catalog',
    ROLE: 'role',
    PERMISSION: 'permission',
    USER: 'user',
    ACCESS_POLICY: 'access_policy',
    ACCESS_POLICY_MEMBERSHIP: 'access_policy_membership',
} as const;

const GENERATED_HIRING_BUSINESS_ID_FIELDS = {
    TEAM_MEMBER: 'member_id',
    JOB_OPENING: 'opening_id',
    JOB_CANDIDATE: 'candidate_id',
    JOB_ASSESSMENT: 'assessment_id',
    JOB_INTERVIEW: 'interview_id',
} as const;

const GENERATED_HIRING_AUTOPK_FIELDS = {
    TEAM_MEMBER: 'team_member_id',
    JOB_OPENING: 'job_opening_id',
    JOB_CANDIDATE: 'job_candidate_id',
    JOB_ASSESSMENT: 'job_assessment_id',
    JOB_INTERVIEW: 'job_interview_id',
} as const;

/** FK property → related business-id field (from configured join_column targets). */
const GENERATED_HIRING_FK_BUSINESS_FIELDS = {
    owner: 'member_id',
    opening: 'opening_id',
    candidate: 'candidate_id',
    reviewer: 'member_id',
    interviewer: 'member_id',
} as const;

const GENERATED_HIRING_ID_PREFIX = {
    CANDIDATE: 'CAN',
    ASSESSMENT: 'ASM',
    INTERVIEW: 'INT',
} as const;

const GENERATED_HIRING_ID_PAD = {
    CANDIDATE: 4,
    ASSESSMENT: 3,
    INTERVIEW: 3,
} as const;

const GENERATED_HIRING_ROLES = {
    RECRUITER: 'Recruiter',
    INTERVIEWER: 'Interviewer',
} as const;

export {
    GENERATED_HIRING_AUTOPK_FIELDS,
    GENERATED_HIRING_BUSINESS_ID_FIELDS,
    GENERATED_HIRING_ENTITY_NAMES,
    GENERATED_HIRING_FK_BUSINESS_FIELDS,
    GENERATED_HIRING_ID_PAD,
    GENERATED_HIRING_ID_PREFIX,
    GENERATED_HIRING_ROLES,
};
