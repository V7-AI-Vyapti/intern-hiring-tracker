import type {
    BundleDetail,
    BundleRecord,
    CatalogResourceRecord,
    Grant,
    PermissionRecord,
    RoleGrantDetail,
    RoleRecord,
    SessionAccess,
} from '../types/rbac.types.js';
import { uniqueStrings } from '../utils/grants.util.js';

type GrantResponse = {
    resource: string;
    action: string;
};

type RoleResponse = {
    id: string;
    name: string;
    label: string;
    hint: string | null;
    is_system: boolean;
    full_access: boolean;
};

type RoleDetailResponse = RoleResponse & {
    bundle_ids: string[];
    direct_permissions: GrantResponse[];
    effective_permissions: GrantResponse[];
};

type PermissionResponse = {
    id: string;
    role_id: string;
    resource: string;
    action: string;
};

type BundleResponse = {
    id: string;
    name: string;
    label: string;
    hint: string | null;
    is_system: boolean;
};

type BundleDetailResponse = BundleResponse & {
    permissions: GrantResponse[];
};

type CatalogResourceResponse = {
    resource: string;
    actions: string[];
};

type SessionResponse = {
    role: RoleResponse | null;
    full_access: boolean;
    permissions: GrantResponse[];
};

function serializeRole(role: RoleRecord): RoleResponse {
    return {
        id: String(role.id),
        name: role.name,
        label: role.label,
        hint: role.hint,
        is_system: role.isSystem,
        full_access: role.fullAccess,
    };
}

function serializeGrants(grants: readonly Grant[]): GrantResponse[] {
    const responses: GrantResponse[] = [];
    for (const grant of grants) {
        responses.push({ resource: grant.resource, action: grant.action });
    }
    return responses;
}

function serializeRoleDetail(detail: RoleGrantDetail): RoleDetailResponse {
    return {
        ...serializeRole(detail.role),
        bundle_ids: detail.bundleIds,
        direct_permissions: serializeGrants(detail.directGrants),
        effective_permissions: serializeGrants(detail.effectiveGrants),
    };
}

function serializePermission(permission: PermissionRecord): PermissionResponse {
    return {
        id: String(permission.id),
        role_id: String(permission.roleId),
        resource: permission.resource,
        action: permission.action,
    };
}

function serializeRoles(roles: RoleRecord[]): RoleResponse[] {
    return roles.map(serializeRole);
}

function serializePermissions(
    permissions: PermissionRecord[],
): PermissionResponse[] {
    return permissions.map(serializePermission);
}

function serializeBundle(bundle: BundleRecord): BundleResponse {
    return {
        id: String(bundle.id),
        name: bundle.name,
        label: bundle.label,
        hint: bundle.hint,
        is_system: bundle.isSystem,
    };
}

function serializeBundles(bundles: BundleRecord[]): BundleResponse[] {
    return bundles.map(serializeBundle);
}

function serializeBundleDetail(detail: BundleDetail): BundleDetailResponse {
    return {
        ...serializeBundle(detail.bundle),
        permissions: serializeGrants(detail.grants),
    };
}

function serializeCatalogResource(
    resource: CatalogResourceRecord,
): CatalogResourceResponse {
    return {
        resource: resource.resource,
        actions: uniqueStrings(resource.actions),
    };
}

function serializeCatalog(
    resources: CatalogResourceRecord[],
): CatalogResourceResponse[] {
    return resources.map(serializeCatalogResource);
}

function serializeBundleIds(bundleIds: string[]): { bundle_ids: string[] } {
    return { bundle_ids: bundleIds };
}

function serializeSession(access: SessionAccess): SessionResponse {
    return {
        role: access.role ? serializeRole(access.role) : null,
        full_access: access.fullAccess,
        permissions: serializeGrants(access.grants),
    };
}

export {
    serializeBundle,
    serializeBundleDetail,
    serializeBundleIds,
    serializeBundles,
    serializeCatalog,
    serializeGrants,
    serializePermission,
    serializePermissions,
    serializeRole,
    serializeRoleDetail,
    serializeRoles,
    serializeSession,
};
export type {
    BundleDetailResponse,
    BundleResponse,
    CatalogResourceResponse,
    GrantResponse,
    PermissionResponse,
    RoleDetailResponse,
    RoleResponse,
    SessionResponse,
};
