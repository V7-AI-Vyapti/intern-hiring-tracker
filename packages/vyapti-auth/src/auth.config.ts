const AUTH_ROUTE_PATHS = {
    LOGIN: 'login',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
    ME: 'me',
    REGISTER: 'register',
    API_KEYS: 'api-keys',
    API_KEY_BY_ID: 'api-keys/:apiKeyId',
    USERS: 'users',
    USER_BY_ID: 'users/:userId',
    USER_FORCE_PASSWORD_RESET: 'users/:userId/force-password-reset',
    PASSWORD_RESET: 'password-reset',
} as const;

export { AUTH_ROUTE_PATHS };
