import { HIRING_ACCESS_POLICY_SCOPE_KEYS } from '../hiring.access-policy.js';
import type { AssessmentRow, InterviewRow } from '../types/hiring.types.js';

type MembershipSeed = {
    userId: string;
    scopeKey: string;
    scopeId: string;
};

/**
 * Build interviewer memberships from assignment rows.
 *
 * Access-policy cannot OR across entities. Candidate access is the union of
 * candidate ids from assessments where reviewer=memberId and interviews where
 * interviewer=memberId, stored under scope_key `assigned_candidate_id`.
 */
const buildInterviewerMemberships = (args: {
    userId: string;
    memberId: string;
    assessments: ReadonlyArray<Pick<AssessmentRow, 'candidate' | 'reviewer'>>;
    interviews: ReadonlyArray<Pick<InterviewRow, 'candidate' | 'interviewer'>>;
}): MembershipSeed[] => {
    const memberships: MembershipSeed[] = [
        {
            userId: args.userId,
            scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.MEMBER_ID,
            scopeId: args.memberId,
        },
    ];

    const candidateIds = new Set<string>();
    for (const row of args.assessments) {
        if (row.reviewer === args.memberId) {
            candidateIds.add(row.candidate);
        }
    }
    for (const row of args.interviews) {
        if (row.interviewer === args.memberId) {
            candidateIds.add(row.candidate);
        }
    }
    for (const candidateId of [...candidateIds].sort()) {
        memberships.push({
            userId: args.userId,
            scopeKey: HIRING_ACCESS_POLICY_SCOPE_KEYS.ASSIGNED_CANDIDATE_ID,
            scopeId: candidateId,
        });
    }
    return memberships;
};

export { buildInterviewerMemberships };
export type { MembershipSeed };
