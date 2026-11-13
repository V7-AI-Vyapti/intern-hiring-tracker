type Grant = {
    resource: string;
    action: string;
};

type RbacContext = Record<string, string | number | boolean | null>;

type RbacPrincipal = {
    id: string;
};

type RbacRequest = {
    user?: RbacPrincipal;
    rbacContext?: RbacContext;
};

type RoleRecord = {
    id: string | number;
    name: string;
    label: string;
    hint: string | null;
    isSystem: boolean;
    fullAccess: boolean;
};

type PermissionRecord = {
    id: string | number;
    roleId: string | number;
    resource: string;
    action: string;
};

type RoleListArgs = {
    search: string | null;
    skip: number;
    take: number;
    sortBy: 'name';
    sortOrder: 'ASC' | 'DESC';
};

type RoleCreateInput = {
    name: string;
    label: string;
    hint?: string | null;
    isSystem?: boolean;
    fullAccess?: boolean;
};

type RoleUpdateInput = {
    name?: string;
    label?: string;
    hint?: string | null;
};

type CatalogResourceRecord = {
    resource: string;
    actions: string[];
};

type BundleRecord = {
    id: string | number;
    name: string;
    label: string;
    hint: string | null;
    isSystem: boolean;
};

type BundleListArgs = RoleListArgs;

type BundleCreateInput = {
    name: string;
    label: string;
    hint?: string | null;
    isSystem?: boolean;
};

type BundleUpdateInput = {
    label?: string;
    hint?: string | null;
};

type SessionAccess = {
    role: RoleRecord | null;
    fullAccess: boolean;
    grants: Grant[];
};

type RoleGrantDetail = {
    role: RoleRecord;
    bundleIds: string[];
    directGrants: Grant[];
    effectiveGrants: Grant[];
};

type BundleDetail = {
    bundle: BundleRecord;
    grants: Grant[];
};

type RbacPersistenceAdapter = {
    findRolesForUser(args: {
        userId: string;
        context?: RbacContext;
    }): Promise<RoleRecord[]>;
    findRole(args: { roleId: string }): Promise<RoleRecord | null>;
    findRoleByName(args: { name: string }): Promise<RoleRecord | null>;
    listRoles(
        args: RoleListArgs,
    ): Promise<{ rows: RoleRecord[]; total: number }>;
    createRole(args: { input: RoleCreateInput }): Promise<RoleRecord>;
    updateRole(args: {
        roleId: string;
        input: RoleUpdateInput;
    }): Promise<RoleRecord | null>;
    deleteRole(args: { roleId: string }): Promise<boolean>;
    listPermissions(args: { roleId: string }): Promise<PermissionRecord[]>;
    replacePermissions(args: {
        roleId: string;
        grants: Grant[];
    }): Promise<PermissionRecord[]>;
    listCatalog(): Promise<CatalogResourceRecord[]>;
    listBundles(
        args: BundleListArgs,
    ): Promise<{ rows: BundleRecord[]; total: number }>;
    findBundle(args: { bundleId: string }): Promise<BundleRecord | null>;
    findBundleByName(args: { name: string }): Promise<BundleRecord | null>;
    createBundle(args: { input: BundleCreateInput }): Promise<BundleRecord>;
    updateBundle(args: {
        bundleId: string;
        input: BundleUpdateInput;
    }): Promise<BundleRecord | null>;
    /** Removes the bundle, its grants, and every role assignment. */
    deleteBundle(args: { bundleId: string }): Promise<boolean>;
    listBundleGrants(args: { bundleId: string }): Promise<Grant[]>;
    replaceBundleGrants(args: {
        bundleId: string;
        grants: Grant[];
    }): Promise<Grant[]>;
    listRoleBundleIds(args: { roleId: string }): Promise<string[]>;
    replaceRoleBundles(args: {
        roleId: string;
        bundleIds: string[];
    }): Promise<string[]>;
    listGrantsForBundles(args: { bundleIds: string[] }): Promise<Grant[]>;
};

type RbacModuleRootOptions = {
    routePrefix: string;
    persistence: RbacPersistenceAdapter;
    forbiddenAs?: '404';
    adminApi?: boolean;
    cacheTtlMs?: number;
};

type ResolvedRbacModuleOptions = {
    routePrefix: string;
    forbiddenAs: '404';
    adminApi: boolean;
    cacheTtlMs: number;
};

export type {
    BundleCreateInput,
    BundleDetail,
    BundleListArgs,
    BundleRecord,
    BundleUpdateInput,
    CatalogResourceRecord,
    Grant,
    PermissionRecord,
    RbacContext,
    RbacModuleRootOptions,
    RbacPersistenceAdapter,
    RbacPrincipal,
    RbacRequest,
    ResolvedRbacModuleOptions,
    RoleCreateInput,
    RoleGrantDetail,
    RoleListArgs,
    RoleRecord,
    RoleUpdateInput,
    SessionAccess,
};
