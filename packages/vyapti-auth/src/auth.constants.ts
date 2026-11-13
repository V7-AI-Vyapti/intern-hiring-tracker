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
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

const AUTH_STRATEGIES = {
    JWT: 'jwt',
    API_KEY: 'api-key',
} as const;

const AUTH_REGISTER_POLICIES = {
    INVITE_ONLY: 'invite-only',
    PUBLIC: 'public',
    ADMIN_CREATES: 'admin-creates',
} as const;

const AUTH_METHODS = {
    JWT: 'jwt',
    API_KEY: 'api-key',
} as const;

const AUTH_COOKIE = {
    NAME: 'refresh_token',
    SAME_SITE: 'Strict',
} as const;

const AUTH_API_KEY = {
    PREFIX: 'v7ak',
    PREFIX_HEX_LENGTH: 16,
    SECRET_BYTE_LENGTH: 32,
} as const;

const AUTH_PASSWORD = {
    MIN_LENGTH: 8,
    BCRYPT_ROUNDS: 12,
} as const;

const AUTH_PASSWORD_RESET = {
    TTL_MS: 60 * 60 * 1000,
    OTP_LENGTH: 6,
} as const;

const AUTH_LIST_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
    SORT_BY: 'created_at',
    SORT_ORDER: 'DESC',
} as const;

const AUTH_USER_LIST_DEFAULTS = {
    SORT_BY: 'email',
    SORT_ORDER: 'ASC',
} as const;

const AUTH_JWT_DEFAULTS = {
    ACCESS_TTL: '1d',
    REFRESH_TTL: '7d',
} as const;

const AUTH_SWAGGER = {
    BEARER_SCHEME: 'bearerAuth',
    TAG: 'Auth',
} as const;

const AUTH_MESSAGES = {
    LOGGED_IN: 'Logged in',
    LOGGED_OUT: 'Logged out',
    TOKEN_REFRESHED: 'Token refreshed',
    REGISTERED: 'Registered',
    PROFILE_FETCHED: 'Profile fetched',
    PROFILE_UPDATED: 'Profile updated',
    API_KEY_ISSUED: 'API key issued',
    API_KEYS_FETCHED: 'API keys fetched',
    USERS_FETCHED: 'Users fetched',
    USER_FETCHED: 'User fetched',
    USER_CREATED: 'User created',
    USER_UPDATED: 'User updated',
    USER_UPDATE_EMPTY: 'At least one field is required',
    PASSWORD_RESET_STARTED: 'Password reset started',
    PASSWORD_UPDATED: 'Password updated',
    API_KEY_REVOKED: 'API key revoked',
    UNAUTHORIZED: 'Authentication required',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_TOKEN: 'Invalid or expired token',
    REFRESH_TOKEN_INVALID: 'Refresh token is invalid or has already been used',
    ACCOUNT_DISABLED: 'Account is disabled',
    REGISTER_DISABLED: 'Registration is not available',
    EMAIL_TAKEN: 'A user with this email already exists',
    API_KEY_AUTH_DISABLED: 'API key authentication is not enabled',
    API_KEY_NOT_FOUND: 'API key not found',
    JWT_KEYS_MISSING: 'Auth JWT keys are missing',
    PERSISTENCE_REQUIRED: 'AuthModule.forRoot requires a persistence adapter',
    USER_NOT_FOUND: 'User not found',
} as const;

const AUTH_TAGS: string[] = [AUTH_SWAGGER.TAG];

export {
    API_METHOD_TYPES,
    AUTH_API_KEY,
    AUTH_COOKIE,
    AUTH_JWT_DEFAULTS,
    AUTH_LIST_DEFAULTS,
    AUTH_USER_LIST_DEFAULTS,
    AUTH_MESSAGES,
    AUTH_METHODS,
    AUTH_PASSWORD,
    AUTH_PASSWORD_RESET,
    AUTH_REGISTER_POLICIES,
    AUTH_STRATEGIES,
    AUTH_SWAGGER,
    AUTH_TAGS,
    HTTP_STATUS_CODES,
};
