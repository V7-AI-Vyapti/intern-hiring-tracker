const GENERATED_RBAC_ENTITY_NAMES = {
    ROLE: 'role',
    PERMISSION: 'permission',
    BUNDLE: 'rbac_bundle',
    BUNDLE_PERMISSION: 'rbac_bundle_permission',
    ROLE_BUNDLE: 'rbac_role_bundle',
    CATALOG: 'rbac_catalog',
    USER: 'user',
} as const;

const GENERATED_RBAC_ADMIN = {
    NAME: 'Admin',
    LABEL: 'Admin',
} as const;

const GENERATED_RBAC_RESOURCE = 'rbac';

const GENERATED_RBAC_ACTIONS = [
    'list',
    'view',
    'create',
    'update',
    'delete',
] as const;

const GENERATED_RBAC_FIELD_LIMITS = {
    NAME: 100,
    LABEL: 200,
    HINT: 500,
    RESOURCE: 200,
    ACTION: 100,
} as const;

export {
    GENERATED_RBAC_ACTIONS,
    GENERATED_RBAC_ADMIN,
    GENERATED_RBAC_ENTITY_NAMES,
    GENERATED_RBAC_FIELD_LIMITS,
    GENERATED_RBAC_RESOURCE,
};
