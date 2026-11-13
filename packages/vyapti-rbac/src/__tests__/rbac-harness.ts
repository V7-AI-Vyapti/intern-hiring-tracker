import { PermissionCacheService } from '../services/permission-cache.service.js';
import { AssertPermissionService } from '../services/assert-permission.service.js';
import { CatalogGrantsService } from '../services/catalog-grants.service.js';
import { EffectiveGrantsService } from '../services/effective-grants.service.js';
import { PermissionCheckService } from '../services/permission-check.service.js';
import type { InMemoryRbacPersistenceAdapter } from './in-memory-rbac.adapter.js';

function buildRbacHarness(adapter: InMemoryRbacPersistenceAdapter) {
    const cache = new PermissionCacheService({
        routePrefix: 'rbac',
        adminApi: true,
        forbiddenAs: '404',
        cacheTtlMs: 30_000,
    });
    const effectiveGrants = new EffectiveGrantsService(adapter);
    const catalogGrants = new CatalogGrantsService(adapter);
    const checker = new PermissionCheckService(effectiveGrants, cache);
    const assertPermission = new AssertPermissionService(checker);
    return { cache, effectiveGrants, catalogGrants, checker, assertPermission };
}

export { buildRbacHarness };
