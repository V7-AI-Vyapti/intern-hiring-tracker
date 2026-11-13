export { AssertPermissionService } from './services/assert-permission.service.js';
export { PermissionsGuard } from './guards/permissions.guard.js';
export { RequirePermission } from './guards/require-permission.decorator.js';
export { RbacModule } from './rbac.module.js';
export type {
    BundleCreateInput,
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
    RoleCreateInput,
    RoleListArgs,
    RoleRecord,
    RoleUpdateInput,
} from './types/rbac.types.js';
