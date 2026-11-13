type AccessPolicyMode = 'unrestricted' | 'filter' | 'deny';

type AccessPolicyPrincipal = {
    id: string;
    isSystemAdmin?: boolean;
};

type AccessPolicyRequest = {
    user?: AccessPolicyPrincipal;
    accessPolicy?: AccessFilter;
};

type AccessFilter =
    | { unrestricted: true }
    | { deny: true }
    | { field: string; op: 'in'; values: string[] };

type PolicyRecord = {
    id: string | number;
    entityName: string;
    mode: AccessPolicyMode;
    constraintField: string | null;
    scopeKey: string | null;
};

type MembershipRecord = {
    id: string | number;
    userId: string;
    scopeKey: string;
    scopeId: string;
};

type PolicyListArgs = {
    search: string | null;
    skip: number;
    take: number;
    sortBy: 'entity_name';
    sortOrder: 'ASC' | 'DESC';
};

type PolicyWriteInput = {
    entityName: string;
    mode: AccessPolicyMode;
    constraintField: string | null;
    scopeKey: string | null;
};

type PolicyUpdateInput = {
    mode?: AccessPolicyMode;
    constraintField?: string | null;
    scopeKey?: string | null;
};

type MembershipListArgs = {
    userId?: string | null;
    scopeKey?: string | null;
    search?: string | null;
    skip?: number;
    take?: number;
    sortBy?: 'scope_key' | 'scope_id';
    sortOrder?: 'ASC' | 'DESC';
};

type MembershipWriteInput = {
    userId: string;
    scopeKey: string;
    scopeId: string;
};

type CallerScopes = {
    unrestricted: boolean;
    scopes: Record<string, string[]>;
};

type AccessPolicyPersistenceAdapter = {
    findPolicy(args: { entityName: string }): Promise<PolicyRecord | null>;
    findPolicyById(args: { policyId: string }): Promise<PolicyRecord | null>;
    listPolicies(
        args: PolicyListArgs,
    ): Promise<{ rows: PolicyRecord[]; total: number }>;
    createPolicy(args: { input: PolicyWriteInput }): Promise<PolicyRecord>;
    updatePolicy(args: {
        policyId: string;
        input: PolicyUpdateInput;
    }): Promise<PolicyRecord | null>;
    deletePolicy(args: { policyId: string }): Promise<boolean>;
    /**
     * Omit skip/take to return every matching row. The resolver depends on
     * that; the admin list always passes a page.
     */
    listMemberships(
        args: MembershipListArgs,
    ): Promise<{ rows: MembershipRecord[]; total: number }>;
    findMembership(args: {
        userId: string;
        scopeKey: string;
        scopeId: string;
    }): Promise<MembershipRecord | null>;
    createMembership(args: {
        input: MembershipWriteInput;
    }): Promise<MembershipRecord>;
    createMemberships(args: {
        inputs: MembershipWriteInput[];
    }): Promise<MembershipRecord[]>;
    deleteMembership(args: { membershipId: string }): Promise<boolean>;
};

type ReadIsSystemAdmin = (request: AccessPolicyRequest) => boolean;

type AccessPolicyModuleRootOptions = {
    routePrefix: string;
    persistence: AccessPolicyPersistenceAdapter;
    forbiddenAs?: '404';
    adminApi?: boolean;
    cacheTtlMs?: number;
    readIsSystemAdmin?: ReadIsSystemAdmin;
};

type ResolvedAccessPolicyModuleOptions = {
    routePrefix: string;
    forbiddenAs: '404';
    adminApi: boolean;
    cacheTtlMs: number;
    readIsSystemAdmin: ReadIsSystemAdmin;
};

export type {
    AccessFilter,
    AccessPolicyMode,
    AccessPolicyModuleRootOptions,
    AccessPolicyPersistenceAdapter,
    AccessPolicyPrincipal,
    AccessPolicyRequest,
    CallerScopes,
    MembershipListArgs,
    MembershipRecord,
    MembershipWriteInput,
    PolicyListArgs,
    PolicyRecord,
    PolicyUpdateInput,
    PolicyWriteInput,
    ReadIsSystemAdmin,
    ResolvedAccessPolicyModuleOptions,
};
