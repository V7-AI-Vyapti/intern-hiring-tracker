import {
    AUTH_COOKIE,
    AUTH_JWT_DEFAULTS,
    AUTH_MESSAGES,
    AUTH_REGISTER_POLICIES,
    AUTH_STRATEGIES,
} from '../auth.constants.js';
import type {
    AuthModuleRootOptions,
    AuthRegisterPolicy,
    AuthStrategy,
    ResolvedAuthModuleOptions,
} from '../types/auth.types.js';
import { loadJwtKeys } from './load-jwt-keys.util.js';
import {
    normalizeRoutePrefix,
    routePrefixToCookiePath,
} from './normalize-route-prefix.util.js';
import { parseTtlToSeconds } from './parse-ttl.util.js';

const DEFAULT_STRATEGIES: AuthStrategy[] = [
    AUTH_STRATEGIES.JWT,
    AUTH_STRATEGIES.API_KEY,
];

function resolveAuthModuleOptions(
    options: AuthModuleRootOptions,
): ResolvedAuthModuleOptions {
    if (!options.persistence) {
        throw new Error(AUTH_MESSAGES.PERSISTENCE_REQUIRED);
    }

    const routePrefix = normalizeRoutePrefix(options.routePrefix);
    const accessTtl = options.jwt.accessTtl ?? AUTH_JWT_DEFAULTS.ACCESS_TTL;
    const refreshTtl = options.jwt.refreshTtl ?? AUTH_JWT_DEFAULTS.REFRESH_TTL;
    const keys = loadJwtKeys({
        privateKeyEnv: options.jwt.privateKeyEnv,
        publicKeyEnv: options.jwt.publicKeyEnv,
    });
    const strategies = options.strategies ?? DEFAULT_STRATEGIES;
    const registerPolicy: AuthRegisterPolicy =
        options.registerPolicy ?? AUTH_REGISTER_POLICIES.INVITE_ONLY;

    return {
        routePrefix,
        cookieName: options.cookie?.name ?? AUTH_COOKIE.NAME,
        cookiePath: options.cookie?.path ?? routePrefixToCookiePath(routePrefix),
        cookieSecure:
            options.cookie?.secure ?? process.env.NODE_ENV === 'production',
        strategies,
        registerPolicy,
        globalGuard: options.globalGuard ?? true,
        jwt: {
            privateKey: keys.privateKey,
            publicKey: keys.publicKey,
            accessTtl,
            accessTtlSeconds: parseTtlToSeconds(accessTtl),
            refreshTtl,
            refreshTtlSeconds: parseTtlToSeconds(refreshTtl),
        },
    };
}

export { resolveAuthModuleOptions };
