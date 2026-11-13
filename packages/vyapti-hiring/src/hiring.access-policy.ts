import type { PolicyWriteInput } from '@vyapti/access-policy';
import { HIRING_ENTITY_ACTIONS, HIRING_ENTITY_RESOURCES } from './hiring.catalog.js';

/**
 * Access-policy v1 (exact Vyapti shape):
 * - one policy per entity_name
 * - modes: unrestricted | filter | deny
 * - filter: single constraint_field + scope_key; runtime op is only `in`
 * - memberships: { user_id, scope_key, scope_id }
 * - bypass: request.user.isSystemAdmin === true (Admin is_system, and hiring
 *   host also marks Recruiter so Recruiters stay unrestricted)
 *
 * OR across assessment.reviewer / interview.interviewer is NOT supported.
 * Candidate visibility uses materialized `assigned_candidate_id` memberships.
 */

const HIRING_ACCESS_POLICY_SCOPE_KEYS = {
    MEMBER_ID: 'member_id',
    ASSIGNED_CANDIDATE_ID: 'assigned_candidate_id',
} as const;

/**
 * Policies for generated CRUD. Delete is intentionally absent from RBAC
 * entity grants; policies do not grant write scope beyond RBAC.
 */
const HIRING_ACCESS_POLICY_DEFINITIONS: readonly PolicyWriteInput[] = [
    {
        entityName: 'team_member',
        mode: 'filter',
        constraintField: 'member_id',
        scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID,
    },
    {
        // Openings are shared reference data for interviewers (titles/rounds).
        entityName: 'job_opening',
        mode: 'unrestricted',
        constraintField: null,
        scopeKey: null,
    },
    {
        entityName: 'job_candidate',
        mode: 'filter',
        constraintField: 'candidate_id',
        scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.ASSIGNED_CANDIDATE_ID,
    },
    {
        entityName: 'job_assessment',
        mode: 'filter',
        constraintField: 'reviewer',
        scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID,
    },
    {
        entityName: 'job_interview',
        mode: 'filter',
        constraintField: 'interviewer',
        scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID,
    },
];

/** HTTP/admin API body shape used by India Vision seed scripts. */
const HIRING_ACCESS_POLICY_HTTP_SEEDS = HIRING_ACCESS_POLICY_DEFINITIONS.map(
    (policy) => ({
        entity_name: policy.entityName,
        mode: policy.mode,
        constraint_field: policy.constraintField,
        scope_key: policy.scopeKey,
    }),
);

const HIRING_CRUD_WRITE_ACTIONS = ['create', 'update'] as const;
const HIRING_CRUD_READ_ACTIONS = ['list', 'view'] as const;

const hiringEntityAllowsDelete = (): boolean => false;

const hiringEntityAllowsCrudWrite = (args: {
    roleName: string;
    entityName: string;
    action: string;
}): boolean => {
    if (!(HIRING_ENTITY_RESOURCES as readonly string[]).includes(args.entityName)) {
        return false;
    }
    if (args.action === 'delete') {
        return false;
    }
    if (!(HIRING_ENTITY_ACTIONS as readonly string[]).includes(args.action)) {
        return false;
    }
    if (args.roleName === 'Recruiter' || args.roleName === 'Admin') {
        return (HIRING_CRUD_WRITE_ACTIONS as readonly string[]).includes(
            args.action,
        );
    }
    // Interviewer: list/view only (RBAC grants); no CRUD writes.
    return false;
};

const hiringEntityAllowsCrudRead = (args: {
    roleName: string;
    entityName: string;
}): boolean => {
    if (!(HIRING_ENTITY_RESOURCES as readonly string[]).includes(args.entityName)) {
        return false;
    }
    if (args.roleName === 'Recruiter' || args.roleName === 'Admin') {
        return true;
    }
    if (args.roleName === 'Interviewer') {
        return (HIRING_CRUD_READ_ACTIONS as readonly string[]).every((action) =>
            (HIRING_ENTITY_ACTIONS as readonly string[]).includes(action),
        );
    }
    return false;
};

export {
    HIRING_ACCESS_POLICY_DEFINITIONS,
    HIRING_ACCESS_POLICY_HTTP_SEEDS,
    HIRING_ACCESS_POLICY_SCOPE_KEYS,
    HIRING_CRUD_READ_ACTIONS,
    HIRING_CRUD_WRITE_ACTIONS,
    hiringEntityAllowsCrudRead,
    hiringEntityAllowsCrudWrite,
    hiringEntityAllowsDelete,
};
