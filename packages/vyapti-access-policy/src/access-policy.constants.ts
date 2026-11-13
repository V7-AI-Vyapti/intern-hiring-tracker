const API_METHOD_TYPES = {
    POST: 'post',
    GET: 'get',
    PATCH: 'patch',
    DELETE: 'delete',
} as const;

const HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
} as const;

const ACCESS_POLICY_FIELD_LIMITS = {
    ENTITY_NAME: 200,
    FIELD: 200,
    SCOPE_KEY: 200,
    SCOPE_ID: 200,
    USER_ID: 100,
    SCOPE_ID_LIST: 1_000,
} as const;

const ACCESS_POLICY_LIST_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
    POLICY_SORT_BY: 'entity_name',
    MEMBERSHIP_SORT_BY: 'scope_key',
    SORT_ORDER: 'ASC',
} as const;

const ACCESS_POLICY_DEFAULTS = {
    CACHE_TTL_MS: 30_000,
    FORBIDDEN_AS: '404',
    ADMIN_API: false,
} as const;

const ACCESS_POLICY_MODES = {
    UNRESTRICTED: 'unrestricted',
    FILTER: 'filter',
    DENY: 'deny',
} as const;

const ACCESS_POLICY_MESSAGES = {
    ROW_NOT_FOUND: 'Resource not found',
    SCOPE_NOT_ALLOWED: 'Not allowed',
    POLICIES_FETCHED: 'Policies fetched',
    POLICY_CREATED: 'Policy created',
    POLICY_FETCHED: 'Policy fetched',
    POLICY_UPDATED: 'Policy updated',
    POLICY_DELETED: 'Policy deleted',
    POLICY_NOT_FOUND: 'Policy not found',
    POLICY_ENTITY_TAKEN: 'A policy for this entity already exists',
    FILTER_FIELDS_REQUIRED:
        'A filter policy requires constraint_field and scope_key',
    MEMBERSHIPS_FETCHED: 'Memberships fetched',
    MEMBERSHIP_CREATED: 'Membership created',
    MEMBERSHIPS_CREATED: 'Memberships created',
    MEMBERSHIP_DELETED: 'Membership deleted',
    MEMBERSHIP_NOT_FOUND: 'Membership not found',
    MEMBERSHIP_TAKEN: 'This scope is already assigned to the user',
    DUPLICATE_SCOPE_IDS: 'scope_ids must be unique',
    SESSION_FETCHED: 'Current scopes fetched',
    UNAUTHORIZED: 'Authentication required',
    PERSISTENCE_REQUIRED:
        'AccessPolicyModule.forRoot requires a persistence adapter',
    INVALID_CACHE_TTL: 'Access policy cache TTL must be greater than zero',
} as const;

const ACCESS_POLICY_TAGS: string[] = ['Access policy'];

const ACCESS_POLICY_RESOURCE = 'access_policy';

export {
    ACCESS_POLICY_DEFAULTS,
    ACCESS_POLICY_FIELD_LIMITS,
    ACCESS_POLICY_LIST_DEFAULTS,
    ACCESS_POLICY_MESSAGES,
    ACCESS_POLICY_MODES,
    ACCESS_POLICY_RESOURCE,
    ACCESS_POLICY_TAGS,
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
};
