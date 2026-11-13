import type {
    BundleCreateInput,
    BundleListArgs,
    BundleRecord,
    BundleUpdateInput,
    CatalogResourceRecord,
    Grant,
    PermissionRecord,
    RbacContext,
    RbacPersistenceAdapter,
    RoleCreateInput,
    RoleListArgs,
    RoleRecord,
    RoleUpdateInput,
} from '../types/rbac.types.js';

type RoleBundleLink = {
    roleId: string;
    bundleId: string;
};

class InMemoryRbacPersistenceAdapter implements RbacPersistenceAdapter {
    roles: RoleRecord[] = [
        {
            id: 'admin',
            name: 'Admin',
            label: 'Admin',
            hint: null,
            isSystem: true,
            fullAccess: true,
        },
        {
            id: 'editor',
            name: 'Editor',
            label: 'Editor',
            hint: null,
            isSystem: false,
            fullAccess: false,
        },
    ];

    permissions: PermissionRecord[] = [];
    catalog: CatalogResourceRecord[] = [
        {
            resource: 'article',
            actions: ['list', 'view', 'create', 'update', 'delete'],
        },
        {
            resource: 'rbac',
            actions: ['list', 'view', 'create', 'update', 'delete'],
        },
        { resource: 'site', actions: ['list', 'view', 'approve'] },
        { resource: 'batch', actions: ['list'] },
        { resource: 'form', actions: ['create', 'update', 'publish'] },
    ];

    bundles: BundleRecord[] = [];
    bundleGrants: Array<Grant & { bundleId: string }> = [];
    roleBundles: RoleBundleLink[] = [];
    userRoleIds = new Map<string, string[]>([['user-1', ['editor']]]);
    private nextId = 1;

    async findRolesForUser(args: {
        userId: string;
        context?: RbacContext;
    }): Promise<RoleRecord[]> {
        const roleIds = this.userRoleIds.get(args.userId) ?? [];
        return this.roles.filter(function hasAssignedRole(role) {
            return roleIds.includes(String(role.id));
        });
    }

    async findRole(args: { roleId: string }): Promise<RoleRecord | null> {
        return findById(this.roles, args.roleId);
    }

    async findRoleByName(args: { name: string }): Promise<RoleRecord | null> {
        return findByName(this.roles, args.name);
    }

    async listRoles(
        args: RoleListArgs,
    ): Promise<{ rows: RoleRecord[]; total: number }> {
        return pageRows({
            rows: this.roles,
            args,
            matches: roleMatchesName,
        });
    }

    async createRole(args: { input: RoleCreateInput }): Promise<RoleRecord> {
        const role: RoleRecord = {
            id: this.allocateId(),
            name: args.input.name,
            label: args.input.label,
            hint: args.input.hint ?? null,
            isSystem: args.input.isSystem ?? false,
            fullAccess: args.input.fullAccess ?? false,
        };
        this.roles.push(role);
        return role;
    }

    async updateRole(args: {
        roleId: string;
        input: RoleUpdateInput;
    }): Promise<RoleRecord | null> {
        const role = await this.findRole({ roleId: args.roleId });
        if (!role) {
            return null;
        }
        role.name = args.input.name ?? role.name;
        role.label = args.input.label ?? role.label;
        if (args.input.hint !== undefined) {
            role.hint = args.input.hint;
        }
        return role;
    }

    async deleteRole(args: { roleId: string }): Promise<boolean> {
        if (!removeById(this.roles, args.roleId)) {
            return false;
        }
        this.permissions = this.permissions.filter(
            function otherRole(permission) {
                return String(permission.roleId) !== args.roleId;
            },
        );
        this.roleBundles = this.roleBundles.filter(function otherRole(link) {
            return link.roleId !== args.roleId;
        });
        return true;
    }

    async listPermissions(args: {
        roleId: string;
    }): Promise<PermissionRecord[]> {
        return this.permissions.filter(function belongsToRole(permission) {
            return String(permission.roleId) === args.roleId;
        });
    }

    async replacePermissions(args: {
        roleId: string;
        grants: Grant[];
    }): Promise<PermissionRecord[]> {
        this.permissions = this.permissions.filter(
            function belongsToAnotherRole(permission) {
                return String(permission.roleId) !== args.roleId;
            },
        );
        const replacements: PermissionRecord[] = [];
        for (const grant of args.grants) {
            const permission: PermissionRecord = {
                id: this.allocateId(),
                roleId: args.roleId,
                resource: grant.resource,
                action: grant.action,
            };
            replacements.push(permission);
            this.permissions.push(permission);
        }
        return replacements;
    }

    async listCatalog(): Promise<CatalogResourceRecord[]> {
        return this.catalog;
    }

    async listBundles(
        args: BundleListArgs,
    ): Promise<{ rows: BundleRecord[]; total: number }> {
        return pageRows({
            rows: this.bundles,
            args,
            matches: bundleMatchesNameOrLabel,
        });
    }

    async findBundle(args: { bundleId: string }): Promise<BundleRecord | null> {
        return findById(this.bundles, args.bundleId);
    }

    async findBundleByName(args: {
        name: string;
    }): Promise<BundleRecord | null> {
        return findByName(this.bundles, args.name);
    }

    async createBundle(args: {
        input: BundleCreateInput;
    }): Promise<BundleRecord> {
        const bundle: BundleRecord = {
            id: this.allocateId(),
            name: args.input.name,
            label: args.input.label,
            hint: args.input.hint ?? null,
            isSystem: args.input.isSystem ?? false,
        };
        this.bundles.push(bundle);
        return bundle;
    }

    async updateBundle(args: {
        bundleId: string;
        input: BundleUpdateInput;
    }): Promise<BundleRecord | null> {
        const bundle = await this.findBundle({ bundleId: args.bundleId });
        if (!bundle) {
            return null;
        }
        bundle.label = args.input.label ?? bundle.label;
        if (args.input.hint !== undefined) {
            bundle.hint = args.input.hint;
        }
        return bundle;
    }

    async deleteBundle(args: { bundleId: string }): Promise<boolean> {
        if (!removeById(this.bundles, args.bundleId)) {
            return false;
        }
        this.bundleGrants = this.bundleGrants.filter(
            function otherBundle(grant) {
                return grant.bundleId !== args.bundleId;
            },
        );
        this.roleBundles = this.roleBundles.filter(function otherBundle(link) {
            return link.bundleId !== args.bundleId;
        });
        return true;
    }

    async listBundleGrants(args: { bundleId: string }): Promise<Grant[]> {
        return grantsForBundle(this.bundleGrants, args.bundleId);
    }

    async replaceBundleGrants(args: {
        bundleId: string;
        grants: Grant[];
    }): Promise<Grant[]> {
        this.bundleGrants = this.bundleGrants.filter(
            function otherBundle(grant) {
                return grant.bundleId !== args.bundleId;
            },
        );
        const stored: Grant[] = [];
        for (const grant of args.grants) {
            this.bundleGrants.push({ ...grant, bundleId: args.bundleId });
            stored.push({ resource: grant.resource, action: grant.action });
        }
        return stored;
    }

    async listRoleBundleIds(args: { roleId: string }): Promise<string[]> {
        const bundleIds: string[] = [];
        for (const link of this.roleBundles) {
            if (link.roleId === args.roleId) {
                bundleIds.push(link.bundleId);
            }
        }
        return bundleIds;
    }

    async replaceRoleBundles(args: {
        roleId: string;
        bundleIds: string[];
    }): Promise<string[]> {
        this.roleBundles = this.roleBundles.filter(function otherRole(link) {
            return link.roleId !== args.roleId;
        });
        for (const bundleId of args.bundleIds) {
            this.roleBundles.push({ roleId: args.roleId, bundleId });
        }
        return args.bundleIds;
    }

    async listGrantsForBundles(args: {
        bundleIds: string[];
    }): Promise<Grant[]> {
        const grants: Grant[] = [];
        for (const bundleId of args.bundleIds) {
            grants.push(...grantsForBundle(this.bundleGrants, bundleId));
        }
        return grants;
    }

    private allocateId(): string {
        this.nextId += 1;
        return `id-${this.nextId}`;
    }
}

function findById<T extends { id: string | number }>(
    rows: T[],
    id: string,
): T | null {
    for (const row of rows) {
        if (String(row.id) === id) {
            return row;
        }
    }
    return null;
}

function findByName<T extends { name: string }>(
    rows: T[],
    name: string,
): T | null {
    for (const row of rows) {
        if (row.name === name) {
            return row;
        }
    }
    return null;
}

function removeById<T extends { id: string | number }>(
    rows: T[],
    id: string,
): boolean {
    const index = rows.findIndex(function matches(row) {
        return String(row.id) === id;
    });
    if (index < 0) {
        return false;
    }
    rows.splice(index, 1);
    return true;
}

function roleMatchesName(role: RoleRecord, needle: string): boolean {
    return role.name.toLowerCase().includes(needle);
}

function bundleMatchesNameOrLabel(
    bundle: BundleRecord,
    needle: string,
): boolean {
    return (
        bundle.name.toLowerCase().includes(needle) ||
        bundle.label.toLowerCase().includes(needle)
    );
}

function pageRows<T extends { name: string }>(args: {
    rows: T[];
    args: RoleListArgs;
    matches: (row: T, needle: string) => boolean;
}): { rows: T[]; total: number } {
    const filtered = filterRows(args.rows, args.args.search, args.matches);
    const sorted = sortByName(filtered, args.args.sortOrder);
    return {
        rows: sorted.slice(args.args.skip, args.args.skip + args.args.take),
        total: sorted.length,
    };
}

function filterRows<T>(
    rows: T[],
    search: string | null,
    matches: (row: T, needle: string) => boolean,
): T[] {
    if (!search) {
        return [...rows];
    }
    const needle = search.toLowerCase();
    const matched: T[] = [];
    for (const row of rows) {
        if (matches(row, needle)) {
            matched.push(row);
        }
    }
    return matched;
}

function sortByName<T extends { name: string }>(
    rows: T[],
    sortOrder: 'ASC' | 'DESC',
): T[] {
    const sorted = [...rows];
    sorted.sort(function byName(left, right) {
        const order = left.name.localeCompare(right.name);
        if (sortOrder === 'ASC') {
            return order;
        }
        return -order;
    });
    return sorted;
}

function grantsForBundle(
    grants: Array<Grant & { bundleId: string }>,
    bundleId: string,
): Grant[] {
    const matched: Grant[] = [];
    for (const grant of grants) {
        if (grant.bundleId === bundleId) {
            matched.push({ resource: grant.resource, action: grant.action });
        }
    }
    return matched;
}

export { InMemoryRbacPersistenceAdapter };
