import { AccessPolicyCacheService } from '../services/access-policy-cache.service.js';
import { AccessPolicyFilterService } from '../services/access-policy-filter.service.js';
import { MembershipsService } from '../services/memberships.service.js';
import { PoliciesService } from '../services/policies.service.js';
import type { InMemoryAccessPolicyAdapter } from './in-memory-access-policy.adapter.js';

function buildAccessPolicyHarness(adapter: InMemoryAccessPolicyAdapter) {
    const cache = new AccessPolicyCacheService({
        routePrefix: 'access-policy',
        adminApi: true,
        forbiddenAs: '404',
        cacheTtlMs: 30_000,
        readIsSystemAdmin: function notAdmin() {
            return false;
        },
    });
    const filters = new AccessPolicyFilterService(adapter, cache);
    const policies = new PoliciesService(adapter, cache);
    const memberships = new MembershipsService(adapter, cache);
    return { cache, filters, policies, memberships };
}

export { buildAccessPolicyHarness };
