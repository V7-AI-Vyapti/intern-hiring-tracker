const RBAC_ROUTE_PATHS = {
    ME: 'me',
    CATALOG: 'catalog',
    ROLES: 'roles',
    ROLE_BY_ID: 'roles/:roleId',
    ROLE_PERMISSIONS: 'roles/:roleId/permissions',
    ROLE_BUNDLES: 'roles/:roleId/bundles',
    BUNDLES: 'bundles',
    BUNDLE_BY_ID: 'bundles/:bundleId',
    BUNDLE_PERMISSIONS: 'bundles/:bundleId/permissions',
} as const;

export { RBAC_ROUTE_PATHS };
