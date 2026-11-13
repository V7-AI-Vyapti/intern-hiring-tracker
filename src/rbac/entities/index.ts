import { buildEntitySchema } from '@vyapti/core';
import { Permission } from './permission.entity';
import { RbacBundle } from './rbac_bundle.entity';
import { RbacBundlePermission } from './rbac_bundle_permission.entity';
import { RbacCatalog } from './rbac_catalog.entity';
import { RbacRoleBundle } from './rbac_role_bundle.entity';
import { Role } from './role.entity';

const entitySchemas = [
    buildEntitySchema(Role),
    buildEntitySchema(Permission),
    buildEntitySchema(RbacBundle),
    buildEntitySchema(RbacBundlePermission),
    buildEntitySchema(RbacRoleBundle),
    buildEntitySchema(RbacCatalog),
];

export {
    Permission,
    RbacBundle,
    RbacBundlePermission,
    RbacCatalog,
    RbacRoleBundle,
    Role,
    entitySchemas,
};
