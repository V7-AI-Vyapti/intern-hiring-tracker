import {
    HIRING_INTERVIEWER_ACTIONS,
    HIRING_RECRUITER_ACTIONS,
    HIRING_ROLE_GRANTS,
    type HiringGrant,
} from '../hiring.catalog.js';
import { HIRING_RESOURCE } from '../hiring.constants.js';
import type { HiringCaller } from '../types/hiring.types.js';

const isAdmin = (caller: HiringCaller): boolean =>
    caller.roles.includes('Admin');

const isRecruiter = (caller: HiringCaller): boolean =>
    isAdmin(caller) || caller.roles.includes('Recruiter');

const isInterviewer = (caller: HiringCaller): boolean =>
    caller.roles.includes('Interviewer');

/**
 * Defense-in-depth check matching the seeded Recruiter / Interviewer grant
 * matrix. Controllers also use `@RequirePermission(HIRING_RESOURCE, action)`.
 */
const callerMayPerformHiringAction = (
    caller: HiringCaller,
    action: string,
): boolean => {
    if (isAdmin(caller) || isRecruiter(caller)) {
        return (HIRING_RECRUITER_ACTIONS as readonly string[]).includes(action);
    }
    if (isInterviewer(caller)) {
        return (HIRING_INTERVIEWER_ACTIONS as readonly string[]).includes(
            action,
        );
    }
    return false;
};

const grantsForRole = (roleName: string): readonly HiringGrant[] => {
    if (roleName === 'Recruiter' || roleName === 'Interviewer') {
        return HIRING_ROLE_GRANTS[roleName];
    }
    return [];
};

const roleHasGrant = (
    roleName: string,
    resource: string,
    action: string,
): boolean =>
    grantsForRole(roleName).some(
        (grant) => grant.resource === resource && grant.action === action,
    );

const hiringActionGrant = (action: string): HiringGrant => ({
    resource: HIRING_RESOURCE,
    action,
});

export {
    callerMayPerformHiringAction,
    grantsForRole,
    hiringActionGrant,
    isAdmin,
    isInterviewer,
    isRecruiter,
    roleHasGrant,
};
