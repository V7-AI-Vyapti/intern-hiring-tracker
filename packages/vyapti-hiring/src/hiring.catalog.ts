import { HIRING_ACTIONS, HIRING_RESOURCE } from './hiring.constants.js';
import { MEMBER_ROLES } from './hiring.enums.js';

/**
 * Catalog resource/actions registered into `rbac_catalog` (forms pattern).
 * Entity CRUD verbs are included so generated CRUD and hiring actions share
 * one grant matrix for Recruiter / Interviewer.
 */
const HIRING_ENTITY_RESOURCES = [
    'team_member',
    'job_opening',
    'job_candidate',
    'job_assessment',
    'job_interview',
] as const;

const HIRING_ENTITY_ACTIONS = ['list', 'view', 'create', 'update'] as const;

const HIRING_PERMISSION_CATALOG = [
    {
        resource: HIRING_RESOURCE,
        actions: [...HIRING_ACTIONS],
    },
    ...HIRING_ENTITY_RESOURCES.map((resource) => ({
        resource,
        actions: [...HIRING_ENTITY_ACTIONS],
    })),
] as const;

/** Interviewer may only run these hiring workflow actions. */
const HIRING_INTERVIEWER_ACTIONS = [
    'review_assessment',
    'record_feedback',
] as const;

/** Recruiter may run every hiring workflow action (including dashboard). */
const HIRING_RECRUITER_ACTIONS = [...HIRING_ACTIONS] as const;

type HiringGrant = { resource: string; action: string };

const recruiterEntityGrants = (): HiringGrant[] => {
    const grants: HiringGrant[] = [];
    for (const resource of HIRING_ENTITY_RESOURCES) {
        for (const action of HIRING_ENTITY_ACTIONS) {
            grants.push({ resource, action });
        }
    }
    return grants;
};

const interviewerEntityGrants = (): HiringGrant[] => {
    const grants: HiringGrant[] = [];
    for (const resource of HIRING_ENTITY_RESOURCES) {
        // Read-only entity access; row scope is enforced by hiring services
        // (and access-policy fixtures for generated CRUD).
        grants.push({ resource, action: 'list' });
        grants.push({ resource, action: 'view' });
    }
    return grants;
};

const HIRING_ROLE_GRANTS: Record<
    (typeof MEMBER_ROLES)[number],
    readonly HiringGrant[]
> = {
    Recruiter: [
        ...HIRING_RECRUITER_ACTIONS.map((action) => ({
            resource: HIRING_RESOURCE,
            action,
        })),
        ...recruiterEntityGrants(),
    ],
    Interviewer: [
        ...HIRING_INTERVIEWER_ACTIONS.map((action) => ({
            resource: HIRING_RESOURCE,
            action,
        })),
        ...interviewerEntityGrants(),
    ],
};

export {
    HIRING_ENTITY_ACTIONS,
    HIRING_ENTITY_RESOURCES,
    HIRING_INTERVIEWER_ACTIONS,
    HIRING_PERMISSION_CATALOG,
    HIRING_RECRUITER_ACTIONS,
    HIRING_ROLE_GRANTS,
};
export type { HiringGrant };
