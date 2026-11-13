const GENERATED_AUTH_ENTITY_NAMES = {
    USER: 'user',
    REFRESH_TOKEN: 'refresh_token',
    API_KEY: 'api_key',
} as const;

const GENERATED_AUTH_MESSAGES = {
    BOOTSTRAP_SEEDED: 'Bootstrap admin user seeded',
    BOOTSTRAP_SKIPPED_EXISTS: 'Bootstrap admin user already exists',
    BOOTSTRAP_SKIPPED_MISSING_ENV:
        'Bootstrap admin env vars are unset; skipping seed',
} as const;

export { GENERATED_AUTH_ENTITY_NAMES, GENERATED_AUTH_MESSAGES };
