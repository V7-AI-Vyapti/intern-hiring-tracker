const GENERATED_ACCESS_POLICY_ENTITY_NAMES = {
    POLICY: 'access_policy',
    MEMBERSHIP: 'access_policy_membership',
    USER: 'user',
    ROLE: 'role',
    CATALOG: 'rbac_catalog',
} as const;

const GENERATED_ACCESS_POLICY_RESOURCE = 'access_policy';

const GENERATED_ACCESS_POLICY_ACTIONS = [
    'list',
    'view',
    'create',
    'update',
    'delete',
] as const;

const GENERATED_ACCESS_POLICY_FIELD_LIMITS = {
    ENTITY_NAME: 200,
    MODE: 20,
    FIELD: 200,
    SCOPE_KEY: 200,
    SCOPE_ID: 200,
    USER_ID: 100,
} as const;

export {
    GENERATED_ACCESS_POLICY_ACTIONS,
    GENERATED_ACCESS_POLICY_ENTITY_NAMES,
    GENERATED_ACCESS_POLICY_FIELD_LIMITS,
    GENERATED_ACCESS_POLICY_RESOURCE,
};
