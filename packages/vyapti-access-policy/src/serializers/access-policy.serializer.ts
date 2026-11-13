import type {
    CallerScopes,
    MembershipRecord,
    PolicyRecord,
} from '../types/access-policy.types.js';

type PolicyResponse = {
    id: string;
    entity_name: string;
    mode: PolicyRecord['mode'];
    constraint_field: string | null;
    scope_key: string | null;
};

type MembershipResponse = {
    id: string;
    user_id: string;
    scope_key: string;
    scope_id: string;
};

type SessionResponse = {
    unrestricted: boolean;
    scopes: Record<string, string[]>;
};

function serializePolicy(policy: PolicyRecord): PolicyResponse {
    return {
        id: String(policy.id),
        entity_name: policy.entityName,
        mode: policy.mode,
        constraint_field: policy.constraintField,
        scope_key: policy.scopeKey,
    };
}

function serializePolicies(
    policies: readonly PolicyRecord[],
): PolicyResponse[] {
    const responses: PolicyResponse[] = [];
    for (const policy of policies) {
        responses.push(serializePolicy(policy));
    }
    return responses;
}

function serializeMembership(membership: MembershipRecord): MembershipResponse {
    return {
        id: String(membership.id),
        user_id: membership.userId,
        scope_key: membership.scopeKey,
        scope_id: membership.scopeId,
    };
}

function serializeMemberships(
    memberships: readonly MembershipRecord[],
): MembershipResponse[] {
    const responses: MembershipResponse[] = [];
    for (const membership of memberships) {
        responses.push(serializeMembership(membership));
    }
    return responses;
}

function serializeSession(access: CallerScopes): SessionResponse {
    return {
        unrestricted: access.unrestricted,
        scopes: access.scopes,
    };
}

export type { MembershipResponse, PolicyResponse, SessionResponse };
export {
    serializeMembership,
    serializeMemberships,
    serializePolicies,
    serializePolicy,
    serializeSession,
};
