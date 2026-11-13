import {
    ACCESS_POLICY_DEFAULTS,
    ACCESS_POLICY_MESSAGES,
} from '../access-policy.constants.js';
import type {
    AccessPolicyModuleRootOptions,
    ResolvedAccessPolicyModuleOptions,
} from '../types/access-policy.types.js';

function readIsSystemAdminAsFalse(): boolean {
    return false;
}

function normalizeRoutePrefix(routePrefix: string): string {
    return routePrefix.trim().replace(/^\/+|\/+$/g, '');
}

function resolveAccessPolicyModuleOptions(
    options: AccessPolicyModuleRootOptions,
): ResolvedAccessPolicyModuleOptions {
    if (!options.persistence) {
        throw new Error(ACCESS_POLICY_MESSAGES.PERSISTENCE_REQUIRED);
    }

    const cacheTtlMs =
        options.cacheTtlMs ?? ACCESS_POLICY_DEFAULTS.CACHE_TTL_MS;
    if (!Number.isFinite(cacheTtlMs) || cacheTtlMs <= 0) {
        throw new Error(ACCESS_POLICY_MESSAGES.INVALID_CACHE_TTL);
    }

    return {
        routePrefix: normalizeRoutePrefix(options.routePrefix),
        forbiddenAs: options.forbiddenAs ?? ACCESS_POLICY_DEFAULTS.FORBIDDEN_AS,
        adminApi: options.adminApi ?? ACCESS_POLICY_DEFAULTS.ADMIN_API,
        cacheTtlMs,
        readIsSystemAdmin:
            options.readIsSystemAdmin ?? readIsSystemAdminAsFalse,
    };
}

export { resolveAccessPolicyModuleOptions };
