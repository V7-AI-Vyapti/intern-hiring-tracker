import { GENERATED_AUTH_CONFIG } from '../auth.config';

function resolveAuthCookiePath(): string {
    const apiPrefix = (process.env.API_PREFIX ?? 'api').replace(
        /^\/+|\/+$/g,
        '',
    );
    return `/${apiPrefix}/${GENERATED_AUTH_CONFIG.API_VERSION}/${GENERATED_AUTH_CONFIG.ROUTE_PREFIX}`;
}

export { resolveAuthCookiePath };
