const ACCESS_POLICY_ROUTE_PATHS = {
    ME: 'me',
    POLICIES: 'policies',
    POLICY_BY_ID: 'policies/:policyId',
    MEMBERSHIPS: 'memberships',
    MEMBERSHIPS_BULK: 'memberships/bulk',
    MEMBERSHIP_BY_ID: 'memberships/:membershipId',
} as const;

export { ACCESS_POLICY_ROUTE_PATHS };
