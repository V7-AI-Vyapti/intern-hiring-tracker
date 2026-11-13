import { RBAC_DEFAULTS, RBAC_MESSAGES } from '../rbac.constants.js';
import type {
    RbacModuleRootOptions,
    ResolvedRbacModuleOptions,
} from '../types/rbac.types.js';

function normalizeRoutePrefix(routePrefix: string): string {
    return routePrefix.trim().replace(/^\/+|\/+$/g, '');
}

function resolveRbacModuleOptions(
    options: RbacModuleRootOptions,
): ResolvedRbacModuleOptions {
    if (!options.persistence) {
        throw new Error(RBAC_MESSAGES.PERSISTENCE_REQUIRED);
    }

    const cacheTtlMs = options.cacheTtlMs ?? RBAC_DEFAULTS.CACHE_TTL_MS;
    if (!Number.isFinite(cacheTtlMs) || cacheTtlMs <= 0) {
        throw new Error(RBAC_MESSAGES.INVALID_CACHE_TTL);
    }

    return {
        routePrefix: normalizeRoutePrefix(options.routePrefix),
        forbiddenAs: options.forbiddenAs ?? RBAC_DEFAULTS.FORBIDDEN_AS,
        adminApi: options.adminApi ?? RBAC_DEFAULTS.ADMIN_API,
        cacheTtlMs,
    };
}

export { normalizeRoutePrefix, resolveRbacModuleOptions };
