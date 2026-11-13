import {
    HIRING_ACCESS_POLICY_DEFINITIONS,
    HIRING_ACCESS_POLICY_HTTP_SEEDS,
    HIRING_PERMISSION_CATALOG,
    HIRING_ROLE_GRANTS,
    MEMBER_ROLES,
} from '@vyapti/hiring';

/**
 * Combined RBAC + access-policy fixture for Intern Hiring Tracker deploys.
 *
 * Policies match `HIRING_ACCESS_POLICY_DEFINITIONS` (package source of truth).
 * Memberships are not bootstrapped here — use `buildInterviewerMemberships`
 * after auth users and assignment rows exist.
 */
const HIRING_ACCESS_POLICY_SEEDS = HIRING_ACCESS_POLICY_HTTP_SEEDS;

const HIRING_RBAC_FIXTURE = {
    catalog: HIRING_PERMISSION_CATALOG,
    roles: MEMBER_ROLES,
    grants: HIRING_ROLE_GRANTS,
    accessPolicies: HIRING_ACCESS_POLICY_DEFINITIONS,
    accessPolicyHttpSeeds: HIRING_ACCESS_POLICY_SEEDS,
} as const;

export { HIRING_ACCESS_POLICY_SEEDS, HIRING_RBAC_FIXTURE };
