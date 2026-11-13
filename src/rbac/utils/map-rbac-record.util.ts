import {
    readBoolean,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';
import type {
    BundleRecord,
    CatalogResourceRecord,
    Grant,
    PermissionRecord,
    RoleRecord,
} from '@vyapti/rbac';
import { readNullableString } from '@auth/utils/read-nullable-string.util';
import { readStringArray } from './read-json.util';

function mapRoleRecord(row: unknown): RoleRecord {
    return {
        id: readNumber(row, 'role_id'),
        name: readString(row, 'name'),
        label: readString(row, 'label'),
        hint: readNullableString(row, 'hint'),
        isSystem: readBoolean(row, 'is_system'),
        fullAccess: readBoolean(row, 'full_access'),
    };
}

function mapPermissionRecord(row: unknown, roleId: number): PermissionRecord {
    return {
        id: readNumber(row, 'permission_id'),
        roleId,
        resource: readString(row, 'entity_name'),
        action: readString(row, 'operation'),
    };
}

function mapBundleRecord(row: unknown): BundleRecord {
    return {
        id: readNumber(row, 'rbac_bundle_id'),
        name: readString(row, 'name'),
        label: readString(row, 'label'),
        hint: readNullableString(row, 'hint'),
        isSystem: readBoolean(row, 'is_system'),
    };
}

function mapGrant(row: unknown): Grant {
    return {
        resource: readString(row, 'entity_name'),
        action: readString(row, 'operation'),
    };
}

function mapCatalogRecord(row: unknown): CatalogResourceRecord {
    return {
        resource: readString(row, 'resource'),
        actions: readStringArray(row, 'actions'),
    };
}

export {
    mapBundleRecord,
    mapCatalogRecord,
    mapGrant,
    mapPermissionRecord,
    mapRoleRecord,
};
