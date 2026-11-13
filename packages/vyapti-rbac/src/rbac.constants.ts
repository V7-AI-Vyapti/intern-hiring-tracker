const API_METHOD_TYPES = {
    POST: 'post',
    GET: 'get',
    PUT: 'put',
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

const RBAC_FIELD_LIMITS = {
    NAME: 100,
    LABEL: 200,
    HINT: 500,
    RESOURCE: 200,
    ACTION: 100,
    GRANT_LIST: 1_000,
    BUNDLE_LIST: 100,
} as const;

const RBAC_LIST_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
    SORT_BY: 'name',
    SORT_ORDER: 'ASC',
    CATALOG_SORT_BY: 'resource',
} as const;

const RBAC_DEFAULTS = {
    CACHE_TTL_MS: 30_000,
    FORBIDDEN_AS: '404',
    ADMIN_API: false,
} as const;

const RBAC_MESSAGES = {
    ACCESS_DENIED: 'Resource not found',
    ROLE_CREATED: 'Role created',
    ROLES_FETCHED: 'Roles fetched',
    ROLE_FETCHED: 'Role fetched',
    ROLE_UPDATED: 'Role updated',
    ROLE_DELETED: 'Role deleted',
    ROLE_NOT_FOUND: 'Role not found',
    ROLE_NAME_TAKEN: 'A role with this name already exists',
    SYSTEM_ROLE_DELETE_FORBIDDEN: 'System roles cannot be deleted',
    PERMISSIONS_FETCHED: 'Permissions fetched',
    PERMISSIONS_REPLACED: 'Permissions replaced',
    SESSION_FETCHED: 'Current access fetched',
    CATALOG_FETCHED: 'Catalog fetched',
    BUNDLE_CREATED: 'Bundle created',
    BUNDLES_FETCHED: 'Bundles fetched',
    BUNDLE_FETCHED: 'Bundle fetched',
    BUNDLE_UPDATED: 'Bundle updated',
    BUNDLE_DELETED: 'Bundle deleted',
    BUNDLE_NOT_FOUND: 'Bundle not found',
    BUNDLE_NAME_TAKEN: 'A bundle with this name already exists',
    BUNDLE_PERMISSIONS_REPLACED: 'Bundle permissions replaced',
    ROLE_BUNDLES_REPLACED: 'Role bundles replaced',
    SYSTEM_BUNDLE_DELETE_FORBIDDEN: 'System bundles cannot be deleted',
    FULL_ACCESS_GRANTS_FORBIDDEN:
        'A full-access role cannot be assigned grants or bundles',
    UNKNOWN_GRANT: 'Grant is not in the catalog',
    UNAUTHORIZED: 'Authentication required',
    PERSISTENCE_REQUIRED: 'RbacModule.forRoot requires a persistence adapter',
    INVALID_CACHE_TTL: 'RBAC cache TTL must be greater than zero',
} as const;

const RBAC_TAGS: string[] = ['RBAC'];

export {
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
    RBAC_DEFAULTS,
    RBAC_FIELD_LIMITS,
    RBAC_LIST_DEFAULTS,
    RBAC_MESSAGES,
    RBAC_TAGS,
};
