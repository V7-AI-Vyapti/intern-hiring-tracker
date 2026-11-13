import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import { RBAC_PERSISTENCE_ADAPTER } from '../rbac.tokens.js';
import type { Grant, RbacPersistenceAdapter } from '../types/rbac.types.js';
import { grantKey, uniqueGrants } from '../utils/grants.util.js';

@Injectable()
class CatalogGrantsService {
    constructor(
        @Inject(RBAC_PERSISTENCE_ADAPTER)
        private readonly persistence: RbacPersistenceAdapter,
    ) {}

    async acceptGrants(args: { grants: Grant[] }): Promise<Grant[]> {
        const grants = uniqueGrants(args.grants);
        if (grants.length === 0) {
            return grants;
        }

        const known = await this.knownGrantKeys();
        for (const grant of grants) {
            if (!known.has(grantKey(grant))) {
                throw new BadRequestException(RBAC_MESSAGES.UNKNOWN_GRANT);
            }
        }
        return grants;
    }

    private async knownGrantKeys(): Promise<Set<string>> {
        const resources = await this.persistence.listCatalog();
        const keys = new Set<string>();
        for (const resource of resources) {
            for (const action of resource.actions) {
                keys.add(grantKey({ resource: resource.resource, action }));
            }
        }
        return keys;
    }
}

export { CatalogGrantsService };
